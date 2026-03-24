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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET - Lấy tất cả bình luận (public)
    if (req.method === 'GET') {
        const comments = await getData('comments');
        // Không trả editToken ra ngoài
        const safe = (comments || []).map(c => ({ ...c, editToken: undefined }));
        return res.status(200).json(safe);
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

            // Tạo editToken để người gửi có thể sửa/xoá bình luận của mình
            const editToken = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

            const newComment = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
                name: cleanName,
                content: cleanContent,
                editToken: editToken,
                createdAt: new Date().toISOString()
            };

            comments.unshift(newComment);

            if (comments.length > MAX_COMMENTS) {
                comments.splice(MAX_COMMENTS);
            }

            await setData('comments', comments);
            // Trả editToken cho client lưu lại
            return res.status(201).json({ success: true, comment: { ...newComment } });
        } catch (e) {
            return res.status(500).json({ error: 'Lỗi server: ' + e.message });
        }
    }

    // PUT - Sửa bình luận (cần editToken hoặc admin password)
    if (req.method === 'PUT') {
        try {
            const { commentId, content, editToken } = req.body || {};
            const authHeader = req.headers.authorization || '';
            const password = authHeader.replace('Bearer ', '');
            const isAdmin = password === ADMIN_PASSWORD;

            if (!commentId || !content) {
                return res.status(400).json({ error: 'Thiếu commentId hoặc nội dung!' });
            }

            const cleanContent = escapeHtml(content.trim().substring(0, MAX_COMMENT_LENGTH));
            if (!cleanContent) {
                return res.status(400).json({ error: 'Nội dung không được để trống!' });
            }

            let comments = (await getData('comments')) || [];
            const idx = comments.findIndex(c => c.id === commentId);

            if (idx === -1) {
                return res.status(404).json({ error: 'Không tìm thấy bình luận!' });
            }

            // Kiểm tra quyền: admin hoặc đúng editToken
            if (!isAdmin && comments[idx].editToken !== editToken) {
                return res.status(403).json({ error: 'Bạn không có quyền sửa bình luận này!' });
            }

            comments[idx].content = cleanContent;
            comments[idx].editedAt = new Date().toISOString();

            await setData('comments', comments);
            return res.status(200).json({ success: true, message: 'Đã sửa bình luận!' });
        } catch (e) {
            return res.status(500).json({ error: 'Lỗi server: ' + e.message });
        }
    }

    // DELETE - Xoá bình luận (cần editToken hoặc admin password)
    if (req.method === 'DELETE') {
        try {
            const { commentId, editToken } = req.body || {};
            const authHeader = req.headers.authorization || '';
            const password = authHeader.replace('Bearer ', '');
            const isAdmin = password === ADMIN_PASSWORD;

            if (!commentId) {
                return res.status(400).json({ error: 'Thiếu commentId!' });
            }

            let comments = (await getData('comments')) || [];
            const idx = comments.findIndex(c => c.id === commentId);

            if (idx === -1) {
                return res.status(404).json({ error: 'Không tìm thấy bình luận!' });
            }

            // Kiểm tra quyền: admin hoặc đúng editToken
            if (!isAdmin && comments[idx].editToken !== editToken) {
                return res.status(403).json({ error: 'Bạn không có quyền xoá bình luận này!' });
            }

            comments.splice(idx, 1);
            await setData('comments', comments);
            return res.status(200).json({ success: true, message: 'Đã xoá bình luận!' });
        } catch (e) {
            return res.status(500).json({ error: 'Lỗi server: ' + e.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
