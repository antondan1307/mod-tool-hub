const { getData, setData } = require('./_storage');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET - Đọc dữ liệu (public)
    if (req.method === 'GET') {
        const data = await getData('content');
        return res.status(200).json(data || { settings: {}, sections: [] });
    }

    // POST - Ghi dữ liệu (cần mật khẩu admin)
    if (req.method === 'POST') {
        const authHeader = req.headers.authorization || '';
        const password = authHeader.replace('Bearer ', '');

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Sai mật khẩu!' });
        }

        try {
            const newData = req.body;
            if (!newData || !newData.sections) {
                return res.status(400).json({ error: 'Dữ liệu không hợp lệ!' });
            }
            await setData('content', newData);
            return res.status(200).json({ success: true, message: 'Đã lưu thành công!' });
        } catch (e) {
            return res.status(500).json({ error: 'Lỗi server: ' + e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
