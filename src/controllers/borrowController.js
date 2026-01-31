const BorrowLog = require('../models/borrowLog');
const Book = require('../models/book');
const sequelize = require('../models/index');

exports.borrowBook = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { bookId, latitude, longitude } = req.body;
        const userId = req.headers['x-user-id'];

        const book = await Book.findByPk(bookId, { transaction: t });
        if (!book) {
            await t.rollback();
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.stock <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Book out of stock' });
        }

        // Reduce stock
        await book.update({ stock: book.stock - 1 }, { transaction: t });

        // Create borrow log
        const log = await BorrowLog.create({
            userId,
            bookId,
            latitude,
            longitude,
            borrowDate: new Date()
        }, { transaction: t });

        await t.commit();
        res.status(201).json({
            message: 'Book borrowed successfully',
            borrowLog: log
        });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};
