// Server-side proxy: keeps your TMDB token secret. Only allows safe, read-only TMDB paths.
const OK = /^(trending\/(movie|tv)\/week|(movie|tv)\/(popular|now_playing|on_the_air|\d+|\d+\/similar)|search\/multi|discover\/movie)$/;
module.exports = async (req, res) => {
  const token = process.env.TMDB_TOKEN;
  if (!token) return res.status(500).json({ error: 'TMDB_TOKEN is not set on the server.' });
  const path = String(req.query.path || '');
  if (!OK.test(path)) return res.status(400).json({ error: 'Path not allowed.' });
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) if (k !== 'path') q.set(k, String(v));
  try {
    const r = await fetch(`https://api.themoviedb.org/3/${path}?${q}`, { headers: { Authorization: `Bearer ${token}` } });
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(502).json({ error: 'Could not reach TMDB.' }); }
};
