const authMiddleware = (role) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role'];
        const userId = req.headers['x-user-id'];

        if (!userRole) {
            return res.status(401).json({ message: 'No role provided' });
        }

        if (role === 'admin' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (role === 'user' && userRole !== 'user') {
            return res.status(403).json({ message: 'User access required' });
        }

        if (role === 'user' && !userId) {
            return res.status(401).json({ message: 'User ID required' });
        }

        req.userId = userId;
        req.userRole = userRole;
        next();
    };
};

module.exports = authMiddleware;
