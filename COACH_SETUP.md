# AI Output Coach development setup

The API key belongs only in the coach server process. Never prefix it with `EXPO_PUBLIC_`.

## Mock mode

PowerShell:

```powershell
$env:COACH_USE_MOCK='true'
$env:COACH_PORT='8787'
node .\coach-server\server.mjs
```

## OpenAI mode

```powershell
$env:OPENAI_API_KEY='your-server-key'
$env:OPENAI_MODEL='your-supported-structured-output-model'
$env:COACH_USE_MOCK='false'
$env:COACH_PORT='8787'
node .\coach-server\server.mjs
```

Find the computer's LAN IPv4 address with `ipconfig`. Copy `.env.coach.example` to `.env.local`, replace the sample address, and then start Expo:

```powershell
npx.cmd expo start --go --clear
```

The phone and computer must be on the same LAN. Permit inbound TCP 8787 in the Windows firewall only on the private network profile. Test `http://<LAN-IP>:8787` reachability from the phone's browser; a 404 response confirms the server is reachable.
