import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPBaseline, IPBaselineDocument } from './schemas/baseline.schema';
import { SecurityEvent, SecurityEventDocument } from '../events/schemas/event.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AnalysisService {
    constructor(
        @InjectModel(IPBaseline.name)
        private baselineModel: Model<IPBaselineDocument>,
        @InjectModel(SecurityEvent.name)
        private eventModel: Model<SecurityEventDocument>,
    ) {}

    /**
     * Calculates anomaly score (0-100) based on Z-Score
     * Z = (x - mean) / stdDev
     */
    async calculateAnomalyScore(sourceIP: string, eventType: string, currentCount: number): Promise<number> {
        const baseline = await this.baselineModel.findOne({ sourceIP, eventType });
        
        if (!baseline || baseline.sampleCount < 5) {
            // Not enough data, return a neutral score if count is low, or higher if count is extreme
            return currentCount > 50 ? 70 : 10;
        }

        const zScore = (currentCount - baseline.avgFrequency) / (baseline.stdDev || 1);
        
        // Convert Z-score to 0-100 scale
        // A Z-score of 3 means 99.7% of data is below this. We'll treat 3+ as high anomaly.
        let score = Math.min(100, Math.max(0, (zScore / 4) * 100));
        
        return Math.round(score);
    }

    /**
     * Background job to update the statistical baselines for all active IPs
     */
    @Cron(CronExpression.EVERY_HOUR)
    async updateBaselines() {
        console.log('🤖 Analysis Engine: Updating statistical baselines...');
        
        // Get unique IP/Type combinations from the last 24 hours
        const activeUnits = await this.eventModel.aggregate([
            { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
            { $group: { _id: { ip: '$sourceIP', type: '$eventType' } } }
        ]);

        for (const unit of activeUnits) {
            const { ip, type } = unit._id;
            
            // Calculate stats for this unit
            const stats = await this.eventModel.aggregate([
                { $match: { sourceIP: ip, eventType: type } },
                { $group: {
                    _id: null,
                    avg: { $avg: 1 }, // This is overly simplistic for a real IDS, but works for the demo
                    count: { $sum: 1 }
                }}
            ]);

            if (stats.length > 0) {
                await this.baselineModel.findOneAndUpdate(
                    { sourceIP: ip, eventType: type },
                    { 
                        $set: { 
                            avgFrequency: stats[0].avg * 1.2, // Padding
                            stdDev: 2, // Default spread
                            lastCalculated: new Date()
                        },
                        $inc: { sampleCount: 1 }
                    },
                    { upsert: true }
                );
            }
        }
        console.log(`✅ Analysis Engine: Updated baselines for ${activeUnits.length} entities.`);
    }

    /**
     * Looks up or calculates Global Reputation Intelligence for an IP.
     * In a production environment, this would hit an API like AbuseIPDB.
     */
    async getGlobalReputation(ip: string): Promise<any> {
        // Simulate an external intelligence API call

        // Generate synthetic but realistic intelligence based on the IP format
        const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0 >>> 0);
        
        let isp = "Unknown ISP";
        let country = "Unknown";
        let usageType = "Fixed Line ISP";
        let maliciousConfidence = 0;
        let threatTags: string[] = [];

        // Simple psuedorandom mocked attributes
        const rand = (Math.abs(ipNum) % 100);

        if (rand < 20) {
            isp = "DigitalOcean, LLC";
            usageType = "Data Center/Web Hosting";
            maliciousConfidence = 85 + (rand % 15);
            threatTags = ["Brute Force", "Web Spam", "VPN Server"];
        } else if (rand < 40) {
            isp = "Amazon.com services LLC";
            usageType = "Data Center/Web Hosting";
            maliciousConfidence = 40 + (rand % 30);
            threatTags = ["Web Scraper", "Cloud"];
        } else if (rand < 50) {
            isp = "Tor Exit Node";
            usageType = "Anonymizing VPN/Proxy";
            maliciousConfidence = 99;
            threatTags = ["Tor Node", "Anonymizer", "Malicious"];
        } else {
            isp = "Comcast Cable Communications";
            usageType = "Fixed Line ISP";
            maliciousConfidence = rand % 20;
            if (maliciousConfidence > 10) threatTags = ["Botnet Client"];
        }

        return {
            ip,
            reputation: {
                confidenceScore: maliciousConfidence,
                isp,
                usageType,
                threatTags,
                lastReported: maliciousConfidence > 50 ? new Date(Date.now() - (rand * 60000)).toISOString() : null,
                totalReports: maliciousConfidence > 50 ? rand * 3 : 0,
            }
        };
    }
}
