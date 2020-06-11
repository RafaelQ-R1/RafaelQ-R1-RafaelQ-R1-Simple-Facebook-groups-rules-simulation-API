import Group from '../models/Group';

import User from '../models/User';

class GroupModeratorsController {
  async create(req, res) {
    const { group_id, user_id } = req.params;

    const isOwner = await Group.findOne({
      where: { id: group_id, owner_id: req.userId },
    });

    if (!isOwner)
      return res.status(401).json({
        error:
          'Invalid action. Only the administrator can promote members to moderators',
      });

    const group = await Group.findByPk(group_id);
    if (!group) return res.status(400).json({ error: 'Group does not exists' });

    const user = await User.findByPk(user_id);
    if (!user) return res.status(400).json({ error: 'User does not exists' });

    if (user_id === req.userId)
      return res.status(401).json({
        error: 'Invalid action. You cannot promote yourself to a moderator',
      });

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: { association: 'members', where: { id: user_id } },
    });

    if (!isMember)
      return res.status(401).json({
        error:
          "Can't promote to moderator. User is not a member of this group.",
      });

    const isModerator = await Group.findOne({
      where: { id: group_id },
      include: { association: 'moderators', where: { id: user_id } },
    });
    if (isModerator)
      return res.status(401).json({
        error: 'User is already a moderator of this group.',
      });

    const createdModerator = await group.addModerator(user);

    return res.status(201).json(createdModerator);
  }

  async index(req, res) {
    const { group_id } = req.params;

    const groupModerators = await Group.findOne({
      where: { id: group_id },
      attributes: ['id', 'name'],
      include: {
        association: 'moderators',
        attributes: ['id', 'name'],
        order: ['id'],
        required: true,
      },
    });

    if (!groupModerators)
      return res
        .status(400)
        .json({ error: 'No moderators was found in this group' });

    return res.status(200).json(groupModerators);
  }

  async show(req, res) {
    const { group_id, user_id } = req.params;

    const groupModerator = await Group.findOne({
      where: { id: group_id },
      attributes: ['id', 'name'],
      include: {
        association: 'moderators',
        where: { id: user_id },
        attributes: ['id', 'name'],
        required: true,
      },
    });

    if (!groupModerator)
      return res.status(400).json({ error: 'Moderator not found' });

    return res.status(200).json(groupModerator);
  }

  async delete(req, res) {
    const { group_id, user_id } = req.params;

    const group = await Group.findByPk(group_id);
    if (!group) return res.status(400).json({ error: 'Group does not exists' });

    const user = await User.findByPk(user_id);
    if (!user) return res.status(400).json({ error: 'User does not exists' });

    const isOwner = await Group.findOne({
      where: { id: group_id, owner_id: req.userId },
    });

    if (!isOwner)
      return res.status(401).json({
        error:
          'Invalid action. Only the administrator can promote members to moderators',
      });

    const isModerator = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'moderators',
        where: { id: user_id },
        required: true,
      },
    });

    if (!isModerator)
      return res
        .status(400)
        .json({ error: 'User is not moderator of this group' });

    await group.removeModerators(user);

    return res.status(200).json({ msg: 'Moderator successfully removed' });
  }
}

export default new GroupModeratorsController();
