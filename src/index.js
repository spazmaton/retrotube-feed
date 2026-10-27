
function escapeXml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    return text.replace(/[<>&'"]/g, function (match) {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
        }
    });
}


export default {

    async fetch(request, env) {

        const path = new URL(request.url).pathname;
        if (path === "/notifications-test") {
            const username = env.RETROTUBE_USERNAME?.trim();
            if (!username) {
                return new Response('Не задана переменная RETROTUBE_USERNAME.', {
                    status: 503,
                    headers: {
                        'content-type': 'text/plain; charset=utf-8',
                        'cache-control': 'no-store'
                    }
                });
            }
            const notificationResponse = await fetch(`https://retrotube.net/api/v1/users/${encodeURIComponent(username)}/notifications?page=1`, {
                headers: {
                    Cookie: `refreshToken=${env.RETROTUBE_REFRESH_TOKEN}`
                }
            })
            if (!notificationResponse.ok) {
                return new Response(
                    `Ошибка API: ${notificationResponse.status}`,
                    { status: notificationResponse.status }
                );
            }
            const notifications = await notificationResponse.json();
            const content = notifications.items.map(notification =>


                `<entry>
                <title>${escapeXml(notification.message || notification.type || 'Уведомление')}</title>
                
                <content type="text">${escapeXml(notification.data?.text ?? notification.message ?? '')}</content>
                <id>urn:retrotube:notification:${notification._id}</id>
                <updated>${notification.createdAt}</updated>
                <author>
                    <name>${escapeXml(notification.caller?.username ?? '—')}</name>
                </author>
                </entry>
            `).join('\n');
            const notificationAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>RetroTube Feed — Notifications</title>
    <id>urn:retrotube:feed:notifications</id>
    <updated>${notifications.items[0]?.createdAt ?? new Date().toISOString()}</updated>

    ${content}
</feed>`;
            return new Response(notificationAtom, {
                headers: {
                    'content-type': 'application/atom+xml; charset=utf-8',
                    'cache-control': 'no-store'
                }
            });
        }
        const response = await fetch("https://retrotube.net/api/v1/videos?page=1&limit=15&sort=newest");

        const data = await response.json();
        const entries = data.items.map(video => `

			<entry>
			<title>${escapeXml(video.title)}</title>
			<id>urn:retrotube:video:${video._id}</id>
			<link href="https://retrotube.net/watch?v=${video.url}" />
			<updated>${video.createdAt}</updated>
			<author>
				<name>${escapeXml(video.uploadedBy.username)}</name>
			</author>
			</entry>
			
			
		` ).join("\n")

        const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>RetroTube Feed — Latest</title>
    <id>urn:retrotube:feed:latest</id>
    <updated>${data.items[0].createdAt}</updated>

    ${entries}
</feed>`;
        return new Response(atom, {
            headers: {
                'content-type': 'application/atom+xml; charset=utf-8'
            }
        });
    }
};
