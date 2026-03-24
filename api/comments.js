const { getData, setData } = require('./_storage');

const MAX_COMMENTS = 500;
const MAX_COMMENT_LENGTH = 500;
const MAX_NAME_LENGTH = 30;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET - Lấy tất cả bình luận (public)
    if (req.method === 'GET') {
        const comments = await getData('comments');
        return res.status(200).json(comments || []);
    }

    // POST - Thêm bình luận mới (public)
    if (req.method === 'POST') {
        try {
            const { name, content } = req.body;

            if (!name || !content) {
                return res.status(400).json({ error: 'Vui lòng nhập tên và nội dung!' });
            }

            const cleanName = escapeHtml(name.trim().substring(0, MAX_NAME_LENGTH));
            const cleanContent = escapeHtml(content.trim().substring(0, MAX_COMMENT_LENGTH));

            if (!cleanName || !cleanContent) {
                return res.status(400).json({ error: 'Tên và nội dung không được để trống!' });
            }

            const comments = (await getData('comments')) || [];

            const newComment = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
                name: cleanName,
                content: cleanContent,
                createdAt: new Date().toISOString()
            };

            comments.unshift(newComment);

            if (comments.length > MAX_COMMENTS) {
                comments.splice(MAX_COMMENTS);
            }

            await setData('comments', comments);
            return res.status(201).json({ success: true, comment: newComment });
        } catch (e) {
            return res.status(500).json({ error: 'Lỗi server: ' + e.message });
        }
    }

    // DELETE - Xoá bình luận (cần mật khẩu admin)
    if (req.method === 'DELETE') {
        const authHeader = req.headers.authorization || '';
        const password = authHeader.replace('Bearer ', '');

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Sai mật khẩu!' });
        }

        try {
            const { commentId } = req.body || {};
            if (!commentId) {
                return res.status(400).json({ error: 'Thiếu commentId!' });
            }

            let comments = (await getData('comments')) || [];
            const before = comments.length;
            comments = comments.filter(c => c.id !== commentId);

            if (comments.length === before) {
                return res.status(404).json({ error: 'Không tìm thấy bình luận!' });
            }

            await setData('comments', comments);
            return res.status(200).json({ success: true, message: 'Đã xoá bình luận!' });
        } catch (e) {
            return res.status(500).json({ error: 'Lỗi server: ' + e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
