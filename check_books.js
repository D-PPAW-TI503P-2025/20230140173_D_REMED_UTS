const Book = require('./src/models/book');

async function checkBooks() {
    try {
        const books = await Book.findAll();
        console.log('--- Books in Database ---');
        books.forEach(b => {
            console.log(`ID: ${b.id} | Title: ${b.title} | Stock: ${b.stock}`);
        });
        if (books.length === 0) console.log('Database is empty.');
    } catch (err) {
        console.error(err.message);
    } finally {
        process.exit();
    }
}
checkBooks();
