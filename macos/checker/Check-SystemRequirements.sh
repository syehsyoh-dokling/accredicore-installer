#!/usr/bin/env bash
set -euo pipefail
WORKING_DIRECTORY="${1:-$HOME/AccrediCore}"
OUT_FILE="${2:-}"
MIN_DISK_GB="${MIN_DISK_GB:-10}"
PORTS="${PORTS_TO_CHECK:-3000 5432 8000}"
mkdir -p "$WORKING_DIRECTORY/logs" || true

json_escape() {
  python3 - <<'PY2' "$1"
import json, sys
print(json.dumps(sys.argv[1]))
PY2
}

cmd_json() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    local version path
    version="$($name --version 2>/dev/null | head -n 1 || true)"
    path="$(command -v "$name")"
    printf '{"found":true,"version":%s,"path":%s}' "$(json_escape "$version")" "$(json_escape "$path")"
  else
    printf '{"found":false,"version":null,"path":null}'
  fi
}

internet=false
curl -Is https://github.com >/dev/null 2>&1 && internet=true || true
write_access=true
if ! touch "$WORKING_DIRECTORY/logs/.write-test" 2>/dev/null; then
  write_access=false
else
  rm -f "$WORKING_DIRECTORY/logs/.write-test"
fi

free_gb=$(df -Pk "$WORKING_DIRECTORY" 2>/dev/null | awk 'NR==2 {printf "%.2f", $4/1024/1024}')
if [[ -z "$free_gb" ]]; then free_gb="0.00"; fi

ports_json='['
first=1
for port in $PORTS; do
  in_use=false
  process_name=null
  process_id=null
  if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    in_use=true
    pname=$(lsof -iTCP:"$port" -sTCP:LISTEN -Fn | awk -F'n' 'NR==2{print $2}')
    pid=$(lsof -iTCP:"$port" -sTCP:LISTEN -Ft | awk -Ft 'NR==2{print $2}')
    [[ -n "$pname" ]] && process_name=$(json_escape "$pname")
    [[ -n "$pid" ]] && process_id="$pid"
  fi
  [[ $first -eq 0 ]] && ports_json+=','
  first=0
  ports_json+="{\"port\":$port,\"in_use\":$in_use,\"process_id\":${process_id},\"process_name\":${process_name}}"
done
ports_json+=']'

GIT_JSON="$(cmd_json git)"
NODE_JSON="$(cmd_json node)"
NPM_JSON="$(cmd_json npm)"
PNPM_JSON="$(cmd_json pnpm)"
DOCKER_JSON="$(cmd_json docker)"

json_output=$(python3 - <<'PY2' \
  "$WORKING_DIRECTORY" "$MIN_DISK_GB" "$free_gb" "$internet" "$write_access" "$ports_json" \
  "$GIT_JSON" "$NODE_JSON" "$NPM_JSON" "$PNPM_JSON" "$DOCKER_JSON"
import json, platform, sys, datetime
working_directory, min_disk_gb, free_gb, internet, write_access, ports_json, git_json, node_json, npm_json, pnpm_json, docker_json = sys.argv[1:]
ports = json.loads(ports_json)
git = json.loads(git_json)
node = json.loads(node_json)
npm = json.loads(npm_json)
pnpm = json.loads(pnpm_json)
docker = json.loads(docker_json)
port_any = any(p.get('in_use') for p in ports)
pkg_found = npm.get('found') or pnpm.get('found')
summary_pkg = 'Missing'
if pkg_found:
    summary_pkg = 'Warning' if npm.get('found') and not pnpm.get('found') else 'Passed'
result = {
    'generated_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    'system': {
        'operating_system': platform.system(),
        'os_version': platform.release(),
        'architecture': platform.machine(),
        'working_directory': working_directory,
    },
    'summary': {
        'git': 'Passed' if git.get('found') else 'Missing',
        'node': 'Passed' if node.get('found') else 'Missing',
        'package_manager': summary_pkg,
        'docker': 'Passed' if docker.get('found') else 'Missing',
        'disk_space': 'Passed' if float(free_gb) >= float(min_disk_gb) else 'Missing',
        'internet': 'Passed' if internet == 'true' else 'Missing',
        'ports': 'Warning' if port_any else 'Passed',
        'write_access': 'Passed' if write_access == 'true' else 'Missing',
    },
    'checks': {
        'git': {'title': 'Git', 'status': 'Passed' if git.get('found') else 'Missing', 'version': git.get('version'), 'path': git.get('path'), 'detail': 'Git detected successfully.' if git.get('found') else 'Git was not found in PATH.'},
        'node': {'title': 'Node.js', 'status': 'Passed' if node.get('found') else 'Missing', 'version': node.get('version'), 'path': node.get('path'), 'detail': 'Node.js detected successfully.' if node.get('found') else 'Node.js was not found in PATH.'},
        'package_manager': {
            'title': 'npm / pnpm',
            'status': summary_pkg,
            'npm_version': npm.get('version'),
            'pnpm_version': pnpm.get('version'),
            'detail': 'npm found, pnpm not found. You can continue, but pnpm is recommended.' if npm.get('found') and not pnpm.get('found') else ('At least one supported package manager was detected.' if pkg_found else 'Neither npm nor pnpm was detected in PATH.')
        },
        'docker': {'title': 'Docker', 'status': 'Passed' if docker.get('found') else 'Missing', 'version': docker.get('version'), 'path': docker.get('path'), 'detail': 'Docker detected successfully.' if docker.get('found') else 'Docker was not found in PATH.'},
        'disk_space': {'title': 'Available Disk Space', 'status': 'Passed' if float(free_gb) >= float(min_disk_gb) else 'Missing', 'free_gb': float(free_gb), 'minimum_required_gb': float(min_disk_gb), 'detail': f'{free_gb} GB available on the selected drive.' if float(free_gb) >= float(min_disk_gb) else f'Only {free_gb} GB available. Minimum recommended is {min_disk_gb} GB.'},
        'internet': {'title': 'Internet Connection', 'status': 'Passed' if internet == 'true' else 'Missing', 'detail': 'Connection OK. Remote repository and package registry are reachable.' if internet == 'true' else 'Could not confirm outbound connection to required hosts.'},
        'ports': {'title': 'Required Port Availability', 'status': 'Warning' if port_any else 'Passed', 'ports': ports, 'detail': 'One or more required ports are already in use.' if port_any else 'Required ports are available.'},
        'write_access': {'title': 'Write Access to Working Directory', 'status': 'Passed' if write_access == 'true' else 'Missing', 'detail': 'Installer confirmed write access to the default working directory.' if write_access == 'true' else 'Installer could not write to the working directory.'},
    }
}
print(json.dumps(result, indent=2))
PY2
)

echo "$json_output"
if [[ -n "$OUT_FILE" ]]; then
  mkdir -p "$(dirname "$OUT_FILE")"
  printf '%s\n' "$json_output" > "$OUT_FILE"
fi
