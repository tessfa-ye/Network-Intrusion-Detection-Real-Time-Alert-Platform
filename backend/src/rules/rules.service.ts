import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DetectionRule, DetectionRuleDocument } from './schemas/rule.schema';

@Injectable()
export class RulesService {
    constructor(
        @InjectModel(DetectionRule.name)
        private ruleModel: Model<DetectionRuleDocument>,
    ) { }

    async create(ruleData: Partial<DetectionRule>): Promise<DetectionRule> {
        const rule = new this.ruleModel(ruleData);
        return rule.save();
    }

    async findAll(enabled?: boolean): Promise<DetectionRule[]> {
        const filter = enabled !== undefined ? { enabled } : {};
        return this.ruleModel.find(filter).exec();
    }

    async findById(id: string): Promise<DetectionRule | null> {
        return this.ruleModel.findById(id).exec();
    }

    async update(id: string, updateData: Partial<DetectionRule>): Promise<DetectionRule | null> {
        return this.ruleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async delete(id: string): Promise<void> {
        await this.ruleModel.findByIdAndDelete(id).exec();
    }

    async getEnabledRules(): Promise<DetectionRule[]> {
        return this.ruleModel.find({ enabled: true }).exec();
    }
}
