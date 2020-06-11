import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import GroupController from './app/controllers/GroupController';
import GroupModeratorsController from './app/controllers/GroupModeratorsController';
import GroupMembersController from './app/controllers/GroupMembersController';
import GroupBansController from './app/controllers/GroupBansController';
import TopicController from './app/controllers/TopicController';
import CommentController from './app/controllers/CommentController';
import RequestEntryController from './app/controllers/GroupsRequestsEntrysController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

// Session Routes
routes.post('/sessions', SessionController.store);

// users routes
routes.post('/users', UserController.store);

routes.use(authMiddleware);

// users routes
routes.get('/users', UserController.index);
routes.get('/users/:user_id', UserController.show);
routes.put('/users/:user_id', UserController.update);
routes.delete('/users/:user_id,', UserController.delete);

// groups routes
routes.post('/groups', GroupController.create);
routes.get('/groups', GroupController.index);
routes.get('/groups/:group_id', GroupController.show);
routes.delete('/groups/:group_id', GroupController.delete);
routes.put('/groups/:group_id', GroupController.update);

// groupsModerators routes
routes.post(
  '/groupsmoderators/:group_id/:user_id',
  GroupModeratorsController.create
);
routes.get('/groupsmoderators/:group_id', GroupModeratorsController.index);
routes.get(
  '/groupsmoderators/:group_id/:user_id',
  GroupModeratorsController.show
);
routes.delete(
  '/groupsmoderators/:group_id/:user_id',
  GroupModeratorsController.delete
);

// groupsMembers routes
routes.post('/groupsmembers/:group_id/:user_id', GroupMembersController.create);
routes.get('/groupsmembers/:group_id/:user_id', GroupMembersController.show);
routes.get('/groupsmembers/:group_id', GroupMembersController.index);
routes.delete(
  '/groupsmembers/:group_id/:user_id',
  GroupMembersController.delete
);

// groupsBansController routes
routes.post('/groupsbans/:group_id/:user_id', GroupBansController.create);
routes.get('/groupsbans/:group_id', GroupBansController.index);
routes.get('/groupsbans/:group_id/:user_id', GroupBansController.show);
routes.delete('/groupsbans/:group_id/:user_id', GroupBansController.delete);

// RequestEntrys
routes.post('/request_entry/:group_id', RequestEntryController.create);
routes.get('/request_entry/:group_id', RequestEntryController.index);
routes.delete(
  '/request_entry/:group_id/:user_id',
  RequestEntryController.delete
);
routes.put('/request_entry/:group_id/:user_id', RequestEntryController.update);

// topics routes
routes.post('/topics/:group_id', TopicController.create);
routes.get('/:group_id/topics', TopicController.index);
routes.get('/topics/:group_id/:topic_id', TopicController.show);
routes.delete('/topics/:group_id/:topic_id', TopicController.delete);
routes.put('/topics/:group_id/:topic_id', TopicController.update);

// Comments routes
routes.post('/comments/:group_id/:topic_id', CommentController.create);
routes.get('/comments/:group_id/:topic_id', CommentController.index);
routes.get('/comments/:group_id/:topic_id/:comment_id', CommentController.show);
routes.put(
  '/comments/:group_id/:topic_id/:comment_id',
  CommentController.update
);
routes.delete(
  '/comments/:group_id/:topic_id/:comment_id',
  CommentController.delete
);

export default routes;
