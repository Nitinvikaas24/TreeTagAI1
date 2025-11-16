import { Plant } from '../models/Plant.js';
import { Company } from '../models/Company.js';
import ExcelJS from 'exceljs';
import csv from 'csv-parser';
import fs from 'fs';

export class InventoryManagementService {
    async updatePlantStock(plantId, variantName, quantity, officerId) {
        const plant = await Plant.findById(plantId);
        if (!plant) {
            throw new Error('Plant not found');
        }

        const variant = plant.variants.find(v => v.name === variantName);
        if (!variant) {
            throw new Error('Variant not found');
        }

        variant.stock = quantity;
        plant._lastUpdatedBy = officerId;
        
        if (quantity <= variant.minimumStock) {
            await this.notifyLowStock(plant, variant);
        }

        return await plant.save();
    }

    async bulkUpdateFromExcel(filePath, companyId, officerId) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        const updates = [];
        const errors = [];

        worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            try {
                const [scientificName, commonName, category, subCategory, variantName, price, stock] = row.values;

                const plantData = {
                    scientificName,
                    commonNames: [{ name: commonName, language: 'en' }],
                    category,
                    subCategory,
                    companyId,
                    variants: [{
                        name: variantName || 'Default',
                        price: parseFloat(price),
                        stock: parseInt(stock),
                        minimumStock: Math.ceil(parseInt(stock) * 0.2) // 20% of stock as minimum
                    }],
                    pricing: {
                        basePrice: parseFloat(price)
                    },
                    inventory: {
                        available: parseInt(stock),
                        minimumStock: Math.ceil(parseInt(stock) * 0.2)
                    },
                    lastUpdated: {
                        timestamp: new Date(),
                        updatedBy: officerId
                    }
                };

                updates.push(
                    Plant.findOneAndUpdate(
                        { scientificName, companyId },
                        { $set: plantData },
                        { upsert: true, new: true }
                    )
                );
            } catch (error) {
                errors.push({
                    row: rowNumber,
                    error: error.message
                });
            }
        });

        const results = await Promise.allSettled(updates);
        
        return {
            success: results.filter(r => r.status === 'fulfilled').length,
            failed: errors.length,
            errors
        };
    }

    async generateInventoryReport(companyId) {
        const plants = await Plant.find({ companyId })
            .sort({ category: 1, scientificName: 1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory Report');

        // Add headers
        worksheet.columns = [
            { header: 'Scientific Name', key: 'scientificName', width: 30 },
            { header: 'Common Name', key: 'commonName', width: 30 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Sub-Category', key: 'subCategory', width: 20 },
            { header: 'Variant', key: 'variant', width: 20 },
            { header: 'Stock', key: 'stock', width: 10 },
            { header: 'Min. Stock', key: 'minStock', width: 10 },
            { header: 'Price (₹)', key: 'price', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Add data
        plants.forEach(plant => {
            plant.variants.forEach(variant => {
                worksheet.addRow({
                    scientificName: plant.scientificName,
                    commonName: plant.commonNames[0]?.name || '',
                    category: plant.category,
                    subCategory: plant.subCategory,
                    variant: variant.name,
                    stock: variant.stock,
                    minStock: variant.minimumStock,
                    price: variant.price,
                    status: variant.stock <= variant.minimumStock ? 'Low Stock' : 'OK'
                });
            });
        });

        // Style the worksheet
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2F0D9' }
        };

        // Add conditional formatting for low stock
        worksheet.addConditionalFormatting({
            ref: 'I2:I1000',
            rules: [
                {
                    type: 'cellIs',
                    operator: 'equal',
                    formulae: ['"Low Stock"'],
                    style: {
                        fill: {
                            type: 'pattern',
                            pattern: 'solid',
                            bgColor: { argb: 'FFFF9999' }
                        }
                    }
                }
            ]
        });

        return workbook;
    }

    private async notifyLowStock(plant, variant) {
        // Get company details
        const company = await Company.findById(plant.companyId);
        
        // Notify relevant officers
        const inventoryOfficers = company.officers.filter(
            officer => officer.role === 'inventory' && officer.active
        );

        // Here you would implement your notification system
        // This could be email, SMS, or in-app notifications
        // For now, we'll just console.log
        console.log(`Low stock alert for ${plant.scientificName} - ${variant.name}`);
        console.log(`Current stock: ${variant.stock}, Minimum required: ${variant.minimumStock}`);
        console.log(`Notifying officers: ${inventoryOfficers.map(o => o.officerId).join(', ')}`);
    }
}