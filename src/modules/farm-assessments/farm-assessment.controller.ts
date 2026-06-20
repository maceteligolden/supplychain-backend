import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';

import { HTTP_STATUS } from '@/shared/constants';
import { ResponseUtil } from '@/shared/utils';

import { FarmAssessmentService } from './farm-assessment.service';

/**
 * FarmAssessmentController maps HTTP assessment requests to FarmAssessmentService.
 */
@injectable()
export class FarmAssessmentController {
  constructor(
    @inject(FarmAssessmentService)
    private readonly farmAssessmentService: FarmAssessmentService,
  ) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmAssessmentService.listAssessments(id);
    ResponseUtil.success(response, output);
  };

  getById = async (request: Request, response: Response): Promise<void> => {
    const { id, assessmentId } = request.params as { id: string; assessmentId: string };
    const output = await this.farmAssessmentService.getAssessmentById(id, assessmentId);
    ResponseUtil.success(response, output);
  };

  run = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmAssessmentService.runAssessment(id);

    if (output.asyncAccepted) {
      ResponseUtil.success(
        response,
        output.assessment,
        undefined,
        HTTP_STATUS.ACCEPTED,
      );
      return;
    }

    ResponseUtil.success(response, output.assessment, undefined, HTTP_STATUS.CREATED);
  };

  landCoverTimeline = async (request: Request, response: Response): Promise<void> => {
    const { id } = request.params as { id: string };
    const output = await this.farmAssessmentService.getLandCoverTimeline(id);
    ResponseUtil.success(response, output);
  };

  mapContext = async (request: Request, response: Response): Promise<void> => {
    const { id, assessmentId } = request.params as { id: string; assessmentId: string };
    const output = await this.farmAssessmentService.getAssessmentMapContext(
      id,
      assessmentId,
    );
    ResponseUtil.success(response, output);
  };
}
