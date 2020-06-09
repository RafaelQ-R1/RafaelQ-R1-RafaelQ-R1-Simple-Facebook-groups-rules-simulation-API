import * as Yup from 'yup';
import Topic from '../models/Topic';
import Group from '../models/Group';
import Comment from '../models/Comment';

class CommentController {
  async create(req, res) {
    try {
      const { group_id, topic_id } = req.params;
      const { body } = req.body;

      const schema = Yup.object().shape({
        body: Yup.string().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res
          .status(400)
          .json({ error: 'Invalid Comment. Only string format is permitted' });
      }

      const groupExists = await Group.findByPk(group_id);
      if (!groupExists)
        return res.status(400).json({ error: 'Group does not exists' });

      const isMember = await Group.findOne({
        where: {
          id: group_id,
        },
        include: [
          {
            association: 'members',
            where: { id: req.userId },
          },
        ],
      });
      if (!isMember)
        return res
          .status(401)
          .json({ error: 'you are not the member of this group.' });

      const topicExists = await Topic.findByPk(topic_id);
      if (!topicExists)
        return res.status(400).json({ error: 'Topic does not exists' });

      if (topicExists.is_closed)
        return res
          .status(401)
          .json({ error: 'Not possible to comment. The topic closed' });

      const createComment = await Comment.create({
        body,
        author_id: req.userId,
        topic_id,
      });

      return res.status(201).json({
        body: createComment.body,
        author: req.userId,
        topic: topic_id,
        group: group_id,
      });
    } catch (err) {
      return res.status(400).json({ error: err });
    }
  }

  async index(req, res) {
    const { group_id, topic_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const isMember = await Group.findOne({
      where: {
        id: group_id,
      },
      include: [
        {
          association: 'members',
          where: { id: req.userId },
          required: true,
        },
      ],
    });

    if (groupExists.is_private && !isMember)
      return res
        .status(401)
        .json({ error: 'Private Group. Only members can see the content.' });

    const commentsExists = await Topic.findByPk(topic_id, {
      attributes: ['id', 'name', 'createdAt'],
      include: [
        {
          association: 'author',
          attributes: ['id', 'name'],
        },
        {
          association: 'comments',
          attributes: ['id', 'name'],
          include: {
            association: 'author',
            attributes: ['id', 'name'],
          },
        },
      ],
    });

    if (!commentsExists)
      return res.status(4010).json({ error: 'No Comments was found' });

    return res.status(200).json(commentsExists);
  }

  async show(req, res) {
    const { group_id, topic_id, comment_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const isMember = await Group.findOne({
      where: {
        id: group_id,
      },
      include: [
        {
          association: 'members',
          where: { id: req.userId },
        },
      ],
    });

    if (groupExists.is_private && !isMember)
      return res
        .status(401)
        .json({ error: 'Private Group. Only members can see the content.' });

    const commentExists = await Topic.findByPk(topic_id, {
      attributes: ['id', 'name', 'createdAt'],
      include: [
        {
          association: 'author',
          attributes: ['id', 'name'],
        },
        {
          association: 'comments',
          where: { id: comment_id },
          attributes: ['id', 'name'],
          include: {
            association: 'author',
            attributes: ['id', 'name'],
          },
        },
      ],
    });

    if (!commentExists)
      return res.status(401).json({ error: 'No Comments was found' });

    return res.status(200).json(commentExists);
  }

  async update(req, res) {
    const { group_id, topic_id, comment_id } = req.params;
    const { body } = req.body;

    const schema = Yup.object().shape({
      body: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res
        .status(400)
        .json({ error: 'Invalid Comment. Only Text format is permited' });
    }

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const topicExists = await Topic.findByPk(topic_id, {
      include: [
        {
          association: 'comments',
          where: { id: comment_id },
        },
      ],
    });

    if (!topicExists)
      return res
        .status(400)
        .json({ error: 'Topic or Comment does not exists' });

    if (topicExists.is_closed)
      return res.status(401).json({
        error: 'Topic are closed. Is not possible to update comments',
      });

    const isMember = await Group.findOne({
      where: {
        id: group_id,
      },
      include: [
        {
          association: 'members',
          where: { id: req.userId },
        },
      ],
    });

    if (!isMember)
      return res.status(401).json({
        error:
          'You are not a member of this group or you not the author of this comment .',
      });

    const isAuthor = await Comment.findOne({
      where: {
        id: comment_id,
        topic_id,
        author_id: req.userId,
      },
    });

    if (!isAuthor)
      return res.status(401).json({
        error: 'Invalid action. You are not the author of this comment',
      });

    const commentUpdated = await Comment.update(
      {
        body,
      },
      { where: { id: comment_id } }
    );
    return res.status(200).json(commentUpdated);
  }

  async delete(req, res) {
    const { group_id, topic_id, comment_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const topicExists = await Topic.findByPk(topic_id, {
      include: [
        {
          association: 'comments',
          where: { id: comment_id },
        },
      ],
    });

    if (!topicExists)
      return res
        .status(400)
        .json({ error: 'Topic or Comment does not exists' });

    const isMember = await Group.findOne({
      where: {
        id: group_id,
      },
      include: [
        {
          association: 'members',
          where: { id: req.userId },
        },
      ],
    });

    if (!isMember)
      return res.status(401).json({
        error:
          'You are not a member of this group or you not the author of this comment .',
      });

    const isAuthor = await Comment.findOne({
      where: {
        id: comment_id,
        topic_id,
        author_id: req.userId,
      },
    });

    const isAdministrator = await Group.findOne({
      where: {
        id: group_id,
        owner_id: res.userId,
      },
    });

    const isModerator = await Group.findOne({
      where: {
        id: group_id,
        include: [
          {
            association: 'moderators',
            where: {
              id: req.userId,
            },
          },
        ],
      },
    });

    if (!isAuthor && !isModerator && !isAdministrator)
      return res.status(401).json({
        error:
          'Invalid action. Only the author of comment or the administrator and moderators of the group can delete a comment',
      });

    await Comment.destroy(comment_id);

    return res.status(200).json({ msg: 'comment successfully deleted' });
  }
}

export default new CommentController();
