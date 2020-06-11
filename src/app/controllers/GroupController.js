import * as Yup from 'yup';

import Group from '../models/Group';
import User from '../models/User';

class GroupController {
  async create(req, res) {
    const { name, is_private } = req.body;

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      is_private: Yup.boolean().required(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'validation fails' });

    const groupExists = await Group.findOne({
      where: { name },
    });
    if (groupExists)
      return res.status(400).json({ error: 'group already exists' });

    const groupCreated = await Group.create({
      name,
      is_private,
      owner_id: req.userId,
    });
    const user = await User.findByPk(req.userId);

    await user.addGroup(groupCreated);

    return res.json({
      id: groupCreated.id,
      name,
      is_private,
      owner: groupCreated.owner_id,
    });
  }

  async index(req, res) {
    const groups = await Group.findAll({
      attributes: ['id', 'name', 'is_private'],
      order: ['id'],
      include: [
        {
          association: 'administrator',
          attributes: ['id', 'name'],
        },
        {
          association: 'moderators',
          attributes: ['name'],
        },
      ],
    });

    if (!groups) return res.status(400).json({ error: 'no groups was found' });

    return res.status(200).json(groups);
  }

  async show(req, res) {
    const { group_id } = req.params;
    const groupExists = await Group.findByPk(group_id);

    if (!groupExists) return res.status(400).json('group do not exists');

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'members',
        where: { id: req.userId },
        required: true,
      },
    });

    const includeStatement = [];

    if (!isMember && groupExists.is_private) {
      includeStatement.push(
        {
          association: 'administrator',
          attributes: ['id', 'name'],
        },
        {
          association: 'moderators',
          attributes: ['id', 'name'],
        }
      );
    } else {
      includeStatement.push(
        {
          association: 'administrator',
          attributes: ['id', 'name'],
        },
        {
          association: 'moderators',
          attributes: ['id', 'name'],
        },
        {
          association: 'members',
          attributes: ['id', 'name'],
        },
        {
          association: 'topics',
          attributes: ['id', 'name', 'author_id'],
          include: [
            {
              association: 'author',
              attributes: ['id', 'name'],
            },

            {
              association: 'comments',
              attributes: ['id', 'author_id', 'body'],
            },
          ],
        }
      );
    }

    const group = await Group.findByPk(group_id, {
      attributes: ['id', 'name', 'is_private'],
      include: includeStatement,
    });

    return res.status(200).json(group);
  }

  async update(req, res) {
    const { group_id } = req.params;
    const { name, is_private } = req.body;

    const schema = Yup.object().shape({
      name: Yup.string(),
      is_private: Yup.boolean(),
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: 'validation fails' });

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'group do not exists' });

    const isOwner = await Group.findOne({
      where: { id: group_id, owner_id: req.userId },
    });

    const isModerator = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'moderators',
          where: { id: req.userId },
        },
      ],
    });

    if (!isOwner && !isModerator)
      return res
        .status(401)
        .json({ error: 'Only the admin or moderators can update the group' });

    await Group.update(
      {
        name,
        is_private,
      },
      { where: { id: group_id } }
    );

    return res.status(200).json({
      message: 'group successfully updated',
      name,
      is_private,
    });
  }

  async delete(req, res) {
    const { group_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists) return res.status(400).json('Group do not exists');

    const isOwner = await Group.findOne({
      where: { id: group_id, owner_id: req.userId },
    });

    if (!isOwner)
      return res.status(401).json({
        error: 'Only the owner can delete the group',
      });

    await Group.destroy({ where: { id: group_id } });

    return res.status(200).json({ msg: 'group successfully deleted' });
  }
}

export default new GroupController();
