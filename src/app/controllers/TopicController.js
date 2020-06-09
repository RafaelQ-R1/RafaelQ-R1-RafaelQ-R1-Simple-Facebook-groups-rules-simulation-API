import * as Yup from 'yup';
import Topic from '../models/Topic';
import Group from '../models/Group';

class TopicController {
  async create(req, res) {
    const { group_id } = req.params;
    const { name, is_closed } = req.body;
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      is_closed: Yup.boolean().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const group = await Group.findByPk(group_id);
    if (!group) return res.status(400).json({ error: 'group does not exists' });

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'members',
          attributes: ['id'],
          where: {
            id: req.userId,
          },
        },
      ],
    });

    if (!isMember)
      return res.status(401).json({
        error: "Can't create topics. You are not a member of this group",
      });

    const createdTopic = await Topic.create({
      author_id: req.userId,
      group_id: group.id,
      name,
      is_closed,
    });

    return res.status(201).json(createdTopic);
  }

  async index(req, res) {
    const { group_id } = req.params;

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'members',
          attributes: ['id', 'name'],
          where: {
            id: req.userId,
          },
        },
      ],
    });

    const groupTopics = await Group.findByPk(group_id, {
      include: {
        association: 'topics',
        attributes: ['id', 'name', 'is_closed', 'createdAt', 'updatedAt'],
        include: {
          association: 'author',
          attributes: ['id', 'name'],
        },
      },
    });

    if (!isMember && groupTopics.is_private)
      return res
        .status(401)
        .json({ error: 'Private group. Only members can see the content' });

    return res.status(200).json(groupTopics);
  }

  async show(req, res) {
    const { group_id, topic_id } = req.params;

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'members',
          attributes: ['id'],
          where: {
            id: req.userId,
          },
        },
      ],
    });

    const groupTopics = await Group.findByPk(group_id, {
      attributes: ['id', 'name'],
      include: [
        {
          association: 'topics',
          where: { id: topic_id },
          attributes: ['id', 'name'],
          include: {
            association: 'author',
            attributes: ['id', 'name'],
          },
        },
      ],
    });

    if (!isMember && groupTopics.is_private)
      return res
        .status(401)
        .json({ error: 'Private group. Only members can see the content' });

    return res.json(groupTopics);
  }

  async delete(req, res) {
    const { group_id, topic_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'group does not exists' });

    const topicExists = await Topic.findOne({
      where: { id: topic_id },
      include: [
        {
          association: 'group',
          where: {
            id: group_id,
          },
        },
      ],
    });

    if (!topicExists)
      return res.status(400).json({ error: 'topic does not exists' });

    const isMemberAndAuthor = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'members',
          attributes: ['id', 'name'],
          where: {
            id: req.userId,
          },
          include: {
            association: 'topics_created',
            where: { id: topic_id },
          },
        },
      ],
    });
    if (!isMemberAndAuthor)
      return res
        .status(401)
        .json({ error: 'you are not a member of this group ' });

    const isOwner = await Group.findOne({
      where: {
        id: group_id,
        owner_id: req.userId,
      },
    });

    const isModerator = await Group.findByPk(group_id, {
      include: [
        {
          association: 'moderators',
          where: { id: req.userId },
        },
      ],
    });

    if (!isOwner && !isMemberAndAuthor && !isModerator)
      return res.status(401).json({
        error:
          'Only the author, the group administrator or the group moderators can delete a topic',
      });

    await Topic.destroy(topic_id);

    return res.status(200).json({ msg: 'Topic successfully deleted' });
  }

  async update(req, res) {
    const { group_id, topic_id } = req.params;
    const { name, is_closed } = req.body;

    const schema = Yup.object().shape({
      name: Yup.string(),
      is_closed: Yup.boolean(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'group does not exists' });

    const topicExists = await Topic.findOne({
      where: { id: topic_id, group_id },
    });

    if (!topicExists)
      return res.status(400).json({ error: 'topic does not exists' });

    const isMemberAndAuthor = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'members',
          attributes: ['id', 'name'],
          where: {
            id: req.userId,
          },
          include: {
            association: 'topics_created',
            where: { id: topic_id },
          },
        },
      ],
    });
    if (!isMemberAndAuthor)
      return res.status(401).json({
        error:
          'you are not the author of this topic or do not belongs to this group ',
      });

    const topicUpdated = await Topic.update(
      {
        name,
        is_closed,
      },
      { where: { id: topic_id } }
    );
    return res.status(200).json(topicUpdated);
  }
}

export default new TopicController();
