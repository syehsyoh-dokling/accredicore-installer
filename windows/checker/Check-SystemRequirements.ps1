param(
    [string]$WorkingDirectory = "C:\AccrediCore",
    [string[]]$PortsToCheck = @("3005","4173","5432","54321","54323"),
    [double]$MinimumDiskGb = 10,
    [string]$OutFile = ""
)

$ErrorActionPreference = "Stop"

function Get-CommandVersion {
    param(
        [Parameter(Mandatory=$true)][string]$CommandName,
        [string[]]$Args = @("--version")
    )

    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    if (-not $cmd) {
        return [pscustomobject]@{
            found = $false
            version = $null
            path = $null
        }
    }

    try {
        $raw = & $CommandName @Args 2>$null | Select-Object -First 1
        $version = if ($raw) { ($raw | Out-String).Trim() } else { "Detected" }
    } catch {
        $version = "Detected"
    }

    return [pscustomobject]@{
        found = $true
        version = $version
        path = $cmd.Source
    }
}

function Get-PsqlVersion {
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    $candidatePaths = @()
    if ($cmd) { $candidatePaths += $cmd.Source }
    $candidatePaths += @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\14\bin\psql.exe",
        "C:\Program Files\PostgreSQL\13\bin\psql.exe"
    )

    foreach ($root in @("C:\Program Files\PostgreSQL", "C:\Program Files (x86)\PostgreSQL")) {
        if (Test-Path -LiteralPath $root) {
            $candidatePaths += Get-ChildItem -LiteralPath $root -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty FullName
        }
    }

    foreach ($path in $candidatePaths | Select-Object -Unique) {
        if (-not $path -or -not (Test-Path -LiteralPath $path)) { continue }
        try {
            $raw = & $path --version 2>$null | Select-Object -First 1
            return [pscustomobject]@{
                found = $true
                version = if ($raw) { ($raw | Out-String).Trim() } else { "Detected" }
                path = $path
            }
        } catch {
            return [pscustomobject]@{
                found = $true
                version = "Detected"
                path = $path
            }
        }
    }

    return [pscustomobject]@{
        found = $false
        version = $null
        path = $null
    }
}

function Get-DockerVersion {
    $cmd = Get-Command docker -ErrorAction SilentlyContinue
    $candidatePaths = @()
    if ($cmd) { $candidatePaths += $cmd.Source }
    $candidatePaths += @(
        "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
        "C:\Program Files\Docker\Docker\docker.exe"
    )

    foreach ($path in $candidatePaths | Select-Object -Unique) {
        if (-not $path -or -not (Test-Path -LiteralPath $path)) { continue }
        try {
            $raw = & $path --version 2>$null | Select-Object -First 1
            return [pscustomobject]@{
                found = $true
                version = if ($raw) { ($raw | Out-String).Trim() } else { "Detected" }
                path = $path
            }
        } catch {
            return [pscustomobject]@{
                found = $true
                version = "Detected"
                path = $path
            }
        }
    }

    return [pscustomobject]@{
        found = $false
        version = $null
        path = $null
    }
}

function Test-InternetQuick {
    $targets = @(
        @{ host = "github.com"; port = 443 },
        @{ host = "registry.npmjs.org"; port = 443 }
    )

    foreach ($t in $targets) {
        try {
            $ok = Test-NetConnection -ComputerName $t.host -Port $t.port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($ok) { return $true }
        } catch {}
    }

    return $false
}

function Get-UsedPorts {
    param([string[]]$Ports)

    $results = @()
    foreach ($p in $Ports) {
        $entry = [pscustomobject]@{
            port = [int]$p
            in_use = $false
            process_id = $null
            process_name = $null
        }

        try {
            $conn = Get-NetTCPConnection -LocalPort ([int]$p) -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($conn) {
                $entry.in_use = $true
                $entry.process_id = $conn.OwningProcess
                try {
                    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                    if ($proc) { $entry.process_name = $proc.ProcessName }
                } catch {}
            }
        } catch {}

        $results += $entry
    }
    return $results
}

function Test-WriteAccess {
    param([string]$FolderPath)

    try {
        New-Item -ItemType Directory -Path $FolderPath -Force | Out-Null
        $testFile = Join-Path $FolderPath ("write-test-" + [guid]::NewGuid().ToString() + ".tmp")
        "ok" | Set-Content -LiteralPath $testFile -Encoding UTF8
        Remove-Item -LiteralPath $testFile -Force -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}

$git = Get-CommandVersion -CommandName "git"
$node = Get-CommandVersion -CommandName "node"
$npm  = Get-CommandVersion -CommandName "npm"
$pnpm = Get-CommandVersion -CommandName "pnpm"
$docker = Get-DockerVersion
$psql = Get-PsqlVersion

$sysDrive = [System.IO.Path]::GetPathRoot($env:SystemDrive + "\")
$drive = Get-CimInstance Win32_LogicalDisk -Filter ("DeviceID='" + $env:SystemDrive + "'")
$freeGb = if ($drive) { [math]::Round($drive.FreeSpace / 1GB, 2) } else { $null }

$internetOk = Test-InternetQuick
$ports = Get-UsedPorts -Ports $PortsToCheck
$writeOk = Test-WriteAccess -FolderPath (Join-Path $WorkingDirectory "logs")

$dockerFound = $docker.found
$pkgFound = $npm.found -or $pnpm.found
$postgresClientFound = $psql.found
$portAnyInUse = @($ports | Where-Object { $_.in_use }).Count -gt 0

$result = [pscustomobject]@{
    generated_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    system = [pscustomobject]@{
        operating_system = (Get-CimInstance Win32_OperatingSystem).Caption
        os_version = (Get-CimInstance Win32_OperatingSystem).Version
        architecture = $env:PROCESSOR_ARCHITECTURE
        working_directory = $WorkingDirectory
    }
    summary = [pscustomobject]@{
        git = if ($git.found) { "Passed" } else { "Missing" }
        node = if ($node.found) { "Passed" } else { "Missing" }
        package_manager = if ($pkgFound) { if ($npm.found -and -not $pnpm.found) { "Warning" } else { "Passed" } } else { "Missing" }
        docker = if ($dockerFound) { "Passed" } else { "Missing" }
        postgres_client = if ($postgresClientFound) { "Passed" } else { "Missing" }
        disk_space = if ($freeGb -ge $MinimumDiskGb) { "Passed" } else { "Missing" }
        internet = if ($internetOk) { "Passed" } else { "Missing" }
        ports = if ($portAnyInUse) { "Warning" } else { "Passed" }
        write_access = if ($writeOk) { "Passed" } else { "Missing" }
    }
    checks = [pscustomobject]@{
        git = [pscustomobject]@{
            title = "Git"
            status = if ($git.found) { "Passed" } else { "Missing" }
            version = $git.version
            path = $git.path
            detail = if ($git.found) { "Git detected successfully." } else { "Git was not found in PATH." }
        }
        node = [pscustomobject]@{
            title = "Node.js"
            status = if ($node.found) { "Passed" } else { "Missing" }
            version = $node.version
            path = $node.path
            detail = if ($node.found) { "Node.js detected successfully." } else { "Node.js was not found in PATH." }
        }
        package_manager = [pscustomobject]@{
            title = "npm / pnpm"
            status = if ($pkgFound) { if ($npm.found -and -not $pnpm.found) { "Warning" } else { "Passed" } } else { "Missing" }
            npm_version = $npm.version
            pnpm_version = $pnpm.version
            detail = if ($npm.found -and -not $pnpm.found) {
                "npm found, pnpm not found. You can continue, but pnpm is recommended."
            } elseif ($pkgFound) {
                "At least one supported package manager was detected."
            } else {
                "Neither npm nor pnpm was detected in PATH."
            }
        }
        docker = [pscustomobject]@{
            title = "Docker / Docker Desktop"
            status = if ($dockerFound) { "Passed" } else { "Missing" }
            version = $docker.version
            path = $docker.path
            detail = if ($dockerFound) { "Docker detected successfully." } else { "Docker was not detected in the system path." }
        }
        postgres_client = [pscustomobject]@{
            title = "PostgreSQL Client (psql)"
            status = if ($postgresClientFound) { "Passed" } else { "Missing" }
            version = $psql.version
            path = $psql.path
            detail = if ($postgresClientFound) { "psql detected successfully." } else { "psql was not detected in PATH. Step 5 is locked until PostgreSQL client/server is installed and available." }
        }
        disk_space = [pscustomobject]@{
            title = "Available Disk Space"
            status = if ($freeGb -ge $MinimumDiskGb) { "Passed" } else { "Missing" }
            free_gb = $freeGb
            minimum_required_gb = $MinimumDiskGb
            detail = if ($freeGb -ge $MinimumDiskGb) { "$freeGb GB available on the selected drive." } else { "Only $freeGb GB available. Minimum recommended is $MinimumDiskGb GB." }
        }
        internet = [pscustomobject]@{
            title = "Internet Connection"
            status = if ($internetOk) { "Passed" } else { "Missing" }
            detail = if ($internetOk) { "Connection OK. Remote repository and package registry are reachable." } else { "Could not confirm outbound connection to required hosts." }
        }
        ports = [pscustomobject]@{
            title = "Required Port Availability"
            status = if ($portAnyInUse) { "Warning" } else { "Passed" }
            ports = $ports
            detail = if ($portAnyInUse) {
                "One or more required ports are already in use."
            } else {
                "Required ports are available."
            }
        }
        write_access = [pscustomobject]@{
            title = "Write Access to Working Directory"
            status = if ($writeOk) { "Passed" } else { "Missing" }
            detail = if ($writeOk) { "Installer confirmed write access to the default working directory." } else { "Installer could not write to the working directory." }
        }
    }
}

$json = $result | ConvertTo-Json -Depth 8

if ($OutFile) {
    $parent = Split-Path -Parent $OutFile
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Set-Content -LiteralPath $OutFile -Value $json -Encoding UTF8
}

$json
