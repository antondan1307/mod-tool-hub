// API xác thực admin
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { password } = req.body || {};

        if (password === ADMIN_PASSWORD) {
            return res.status(200).json({ success: true, token: password });
        } else {
            return res.status(401).json({ error: 'Sai mật khẩu!' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
