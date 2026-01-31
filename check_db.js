const BorrowLog = require('./src/models/borrowLog');

async function checkLogs() {
    try {
        const logs = await BorrowLog.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        if (logs.length === 0) {
            console.log('--- No borrow logs found in database ---');
            return;
        }

        console.log('--- Latest 5 Borrow Logs ---');
        logs.forEach(log => {
            console.log(`ID: ${log.id} | User: ${log.userId} | Book: ${log.bookId}`);
            console.log(`Location: Lat ${log.latitude}, Lon ${log.longitude}`);
            console.log(`Date: ${log.borrowDate}`);
            console.log('---------------------------');
        });
    } catch (err) {
        console.error('Error checking database:', err.message);
    } finally {
        process.exit();
    }
}

checkLogs();
