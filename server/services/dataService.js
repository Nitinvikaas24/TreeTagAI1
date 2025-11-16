import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { Plant } from '../models/Plant.js';
import { Receipt } from '../models/Receipt.js';

export class DataService {
    async exportToExcel(data, type) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        switch (type) {
            case 'plants':
                this.formatPlantsWorksheet(worksheet, data);
                break;
            case 'sales':
                this.formatSalesWorksheet(worksheet, data);
                break;
            case 'inventory':
                this.formatInventoryWorksheet(worksheet, data);
                break;
            default:
                throw new Error('Invalid export type');
        }

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${type}-export-${timestamp}.xlsx`;
        const filePath = path.join(process.cwd(), 'exports', fileName);

        // Ensure exports directory exists
        if (!fs.existsSync(path.join(process.cwd(), 'exports'))) {
            fs.mkdirSync(path.join(process.cwd(), 'exports'));
        }

        // Save workbook
        await workbook.xlsx.writeFile(filePath);
        return { fileName, filePath };
    }

    formatPlantsWorksheet(worksheet, plants) {
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'Scientific Name', key: 'scientificName', width: 30 },
            { header: 'Common Name', key: 'commonName', width: 30 },
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Stock', key: 'stock', width: 15 },
            { header: 'Category', key: 'category', width: 20 }
        ];

        plants.forEach(plant => {
            worksheet.addRow({
                id: plant._id.toString(),
                scientificName: plant.scientificName,
                commonName: plant.commonNames[0] || '',
                price: plant.price,
                stock: plant.stock,
                category: plant.category
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2F0D9' }
        };
    }

    formatSalesWorksheet(worksheet, sales) {
        worksheet.columns = [
            { header: 'Receipt ID', key: 'receiptId', width: 30 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Customer', key: 'customer', width: 30 },
            { header: 'Items', key: 'items', width: 40 },
            { header: 'Total', key: 'total', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 }
        ];

        sales.forEach(sale => {
            worksheet.addRow({
                receiptId: sale.receiptNumber,
                date: sale.date.toLocaleDateString(),
                customer: sale.customerDetails.name,
                items: sale.items.map(item => `${item.name}(${item.quantity})`).join(', '),
                total: sale.total,
                paymentMethod: sale.paymentMethod
            });
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2F0D9' }
        };
    }

    formatInventoryWorksheet(worksheet, inventory) {
        worksheet.columns = [
            { header: 'Plant ID', key: 'plantId', width: 30 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Current Stock', key: 'stock', width: 15 },
            { header: 'Minimum Stock', key: 'minStock', width: 15 },
            { header: 'Last Updated', key: 'lastUpdated', width: 20 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        inventory.forEach(item => {
            worksheet.addRow({
                plantId: item.plantId,
                name: item.name,
                stock: item.currentStock,
                minStock: item.minimumStock,
                lastUpdated: item.lastUpdated.toLocaleDateString(),
                status: item.currentStock < item.minimumStock ? 'Low' : 'OK'
            });
        });

        worksheet.getRow(1).font = { bold: true };
    }

    async importFromCSV(filePath, type) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        switch (type) {
                            case 'plants':
                                await this.importPlants(results);
                                break;
                            case 'inventory':
                                await this.updateInventory(results);
                                break;
                            default:
                                throw new Error('Invalid import type');
                        }
                        resolve({ success: true, count: results.length });
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => reject(error));
        });
    }

    async importPlants(plants) {
        for (const plant of plants) {
            await Plant.findOneAndUpdate(
                { scientificName: plant.scientificName },
                {
                    commonNames: plant.commonName.split(',').map(name => name.trim()),
                    price: parseFloat(plant.price),
                    stock: parseInt(plant.stock),
                    category: plant.category
                },
                { upsert: true, new: true }
            );
        }
    }

    async updateInventory(inventory) {
        for (const item of inventory) {
            await Plant.findByIdAndUpdate(
                item.plantId,
                {
                    stock: parseInt(item.stock),
                    minimumStock: parseInt(item.minimumStock)
                }
            );
        }
    }

    async generateBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(process.cwd(), 'backups', timestamp);

        // Create backup directory
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Backup plants
        const plants = await Plant.find({});
        await this.exportToExcel(plants, 'plants');

        // Backup sales
        const sales = await Receipt.find({})
            .sort({ date: -1 })
            .limit(1000); // Limit to last 1000 sales
        await this.exportToExcel(sales, 'sales');

        // Create metadata
        const metadata = {
            timestamp,
            plantsCount: plants.length,
            salesCount: sales.length
        };

        fs.writeFileSync(
            path.join(backupDir, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );

        return {
            backupDir,
            metadata
        };
    }
}