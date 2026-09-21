import { Request, Response, NextFunction } from 'express';
import * as feedService from './feed.service';
import { CreateAnnouncementDto, ListFeedQuery } from './feed.schema';
import { ok } from '../../utils/response';

export const list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = req.query as unknown as ListFeedQuery;
    const isAdmin = req.user.role === 'ADMIN';
    const { announcements, meta } = await feedService.list(query, isAdmin);
    res.json(ok(announcements, meta));
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const announcement = await feedService.getById(req.params.id);
    res.json(ok(announcement));
  } catch (err) {
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dto = req.body as CreateAnnouncementDto;
    const announcement = await feedService.create(req.user.sub, req.user.name, dto);
    res.status(201).json(ok(announcement));
  } catch (err) {
    next(err);
  }
};

export const react = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const announcement = await feedService.react(req.params.id);
    res.json(ok(announcement));
  } catch (err) {
    next(err);
  }
};
