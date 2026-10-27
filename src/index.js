
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

	async fetch(request) {
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
