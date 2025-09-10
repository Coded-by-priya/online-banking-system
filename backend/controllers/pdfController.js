const PDFDocument = require("pdfkit");
const db = require("../config/db");

exports.downloadTransactionPDF = async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch user transactions
        const [results] = await db.query(`
            SELECT t.id, t.amount, t.type, t.created_at 
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = ?
            ORDER BY t.created_at DESC
        `, [userId]);

        // Create PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: 'Bank Transaction Statement',
                Author: 'ByteBank Ltd.'
            }
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=statement.pdf");
        doc.pipe(res);

        // Add a subtle background pattern or page border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).fillOpacity(0.05).fill("#2E86C1").fillOpacity(1);

        // HEADER
        doc
            .fillColor("#1B4F72")
            .font('Helvetica-Bold')
            .fontSize(28)
            .text("ByteBank Ltd.", { align: "center" })
            .moveDown(0.5);

        doc
            .fontSize(18)
            .fillColor("#34495E")
            .text("Bank Transaction Statement", { align: "center", underline: true })
            .moveDown(0.7);

        // Generated Info
        doc.fontSize(11).fillColor("#555").text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
        doc.moveDown(1);

        // TABLE HEADER
        const tableTop = doc.y;
        doc
            .fontSize(12)
            .fillColor("#fff")
            .rect(50, tableTop, 500, 25)
            .fill("#2874A6")
            .stroke()
            .fillColor("#fff")
            .font('Helvetica-Bold')
            .text("ID", 55, tableTop + 7, { width: 50, align: "left" })
            .text("Amount", 120, tableTop + 7, { width: 100, align: "right" })
            .text("Type", 240, tableTop + 7, { width: 100, align: "center" })
            .text("Date", 360, tableTop + 7, { width: 180, align: "right" });

        doc.moveDown(1.5);

        // TRANSACTIONS (rows with alternating color and border line)
        results.forEach((tx, index) => {
            const y = doc.y;
            const isEven = index % 2 === 0;
            // Background for rows
            if (isEven) {
                doc.rect(50, y, 500, 20).fill("#F4F6F7").fillOpacity(1);
            }
            // Row text
            doc
                .fillColor("#1C2833")
                .font('Helvetica')
                .fontSize(11)
                .text(tx.id.toString(), 55, y + 5, { width: 50, align: "left" })
                .text(`₹${tx.amount}`, 120, y + 5, { width: 100, align: "right" })
                .text(tx.type, 240, y + 5, { width: 100, align: "center" })
                .text(new Date(tx.created_at).toLocaleString(), 360, y + 5, { width: 180, align: "right" });

            // Row divider line
            doc
                .strokeColor("#D5D8DC")
                .lineWidth(0.5)
                .moveTo(50, y + 20)
                .lineTo(550, y + 20)
                .stroke();

            doc.moveDown(1);
        });

        // FOOTER
        doc.moveDown(2);
        doc
            .fontSize(10)
            .fillColor("#7B7D7D")
            .font('Helvetica-Oblique')
            .text("This is a system generated statement and does not require signature.", { align: "center" });

        doc.end();

    } catch (err) {
        console.error("Error generating PDF:", err);
        res.status(500).json({ message: "Server error while generating PDF" });
    }
};
