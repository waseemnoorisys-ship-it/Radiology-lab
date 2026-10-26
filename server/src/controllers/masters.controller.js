import { ModalityMaster } from '../models/ModalityMaster.js';
import { BodyRegionMaster } from '../models/BodyRegionMaster.js';
import { ExaminationMaster } from '../models/ExaminationMaster.js';
import { ReportTemplate } from '../models/ReportTemplate.js';
import { SupportingMaster } from '../models/SupportingMaster.js';

export async function getModalities(req, res, next) {
  try {
    const modalities = await ModalityMaster.find({ isActive: true }).sort({ order: 1, code: 1 });
    res.json({
      success: true,
      count: modalities.length,
      data: modalities,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBodyRegions(req, res, next) {
  try {
    const { modality } = req.query;
    const filter = { isActive: true };

    if (modality && typeof modality === 'string') {
      filter.applicableModalities = modality.toUpperCase();
    }

    const regions = await BodyRegionMaster.find(filter).sort({ order: 1, displayName: 1 });
    res.json({
      success: true,
      count: regions.length,
      data: regions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExaminations(req, res, next) {
  try {
    const { modality, bodyRegion } = req.query;
    const filter = { isActive: true };

    if (modality && typeof modality === 'string') {
      filter.modalityCode = modality.toUpperCase();
    }
    if (bodyRegion && typeof bodyRegion === 'string') {
      filter.bodyRegionCode = bodyRegion.toUpperCase();
    }

    const examinations = await ExaminationMaster.find(filter).sort({ order: 1, displayName: 1 });
    res.json({
      success: true,
      count: examinations.length,
      data: examinations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportTemplates(req, res, next) {
  try {
    const { code, modality } = req.query;
    const filter = { isActive: true };

    if (code && typeof code === 'string') {
      filter.templateCode = code.toUpperCase();
    }
    if (modality && typeof modality === 'string') {
      filter.modalityCode = modality.toUpperCase();
    }

    const templates = await ReportTemplate.find(filter).sort({ name: 1 });
    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSupportingMasters(req, res, next) {
  try {
    const { category } = req.query;
    const filter = { isActive: true };

    if (category && typeof category === 'string') {
      filter.category = category.toUpperCase();
    }

    const masters = await SupportingMaster.find(filter).sort({ order: 1, displayName: 1 });
    res.json({
      success: true,
      count: masters.length,
      data: masters,
    });
  } catch (error) {
    next(error);
  }
}
