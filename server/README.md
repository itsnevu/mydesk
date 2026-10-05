# Like counter server

`likes.js` runs on the VPS (`ssh vps`) as the `keyboardweb-likes` systemd service, listening on `127.0.0.1:8790`.
Caddy serves it over HTTPS at `https://keyboardweb.37.60.232.191.sslip.io/likes` (`/etc/caddy/sites/keyboardweb.caddy`).
The count is stored in `/var/lib/keyboardweb/likes.json`.

Update the server code:

```bash
scp server/likes.js vps:/opt/keyboardweb-likes/likes.js && ssh vps systemctl restart keyboardweb-likes
```

Reset the count: `ssh vps 'systemctl stop keyboardweb-likes && echo {\"count\":0} > /var/lib/keyboardweb/likes.json && systemctl start keyboardweb-likes'`
