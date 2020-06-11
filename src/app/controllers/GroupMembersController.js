import User from '../models/User';
import Group from '../models/Group';

class GroupMembersController {
  async create(req, res) {
    const { group_id, user_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const userExists = await User.findByPk(user_id);
    if (!userExists)
      return res.status(400).json({ error: 'User does not exists' });

    const isAdministrator = await Group.findOne({
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

    if (!isAdministrator && !isModerator)
      return res.status(401).json({
        error: 'Only the admin or a moderator can accept members in the group',
      });

    const isBanned = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'bans',
          where: {
            id: user_id,
          },
          required: true,
        },
      ],
    });
    if (isBanned)
      return res.status(401).json({
        error:
          'User are banned of this group. The ban is need to be removed to add this user',
      });

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'members',
          attributes: ['id', 'name'],
          where: {
            id: user_id,
          },
        },
      ],
    });
    if (isMember)
      return res.status(401).json({
        error: 'User is already a member of this group.',
      });

    if (!userExists.permitted_to_add_in_groups)
      return res.status(401).json({
        error: "This user don't permit do be add in groups.",
      });

    const addMember = await groupExists.addMember(userExists);

    return res.status(201).json(addMember);
  }

  async index(req, res) {
    const { group_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'members',
        where: { id: req.userId },
        required: true,
      },
    });

    if (!isMember && groupExists.is_private)
      return res
        .status(401)
        .json({ error: 'Private group. Only a member can see the content' });

    const groupUsers = await Group.findByPk(group_id, {
      include: {
        association: 'members',
        attributes: ['id', 'name'],
      },
    });

    if (!groupUsers)
      return res.status(400).json({ error: 'No users were found.' });

    return res.status(200).json(groupUsers);
  }

  async show(req, res) {
    const { group_id, user_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'members',
        where: { id: req.userId },
        required: true,
      },
    });

    if (!isMember && groupExists.is_private)
      return res
        .status(401)
        .json({ error: 'Private group. Only a member can see the content' });

    const groupUser = await Group.findByPk(group_id, {
      include: {
        association: 'members',
        attributes: ['id', 'name'],
        where: { id: user_id },
      },
    });

    if (!groupUser) return res.status(400).json({ error: 'User not found.' });

    return res.status(200).json(groupUser);
  }

  async delete(req, res) {
    const { group_id, user_id } = req.params;
    const user = await User.findByPk(user_id);
    const group = await Group.findByPk(group_id);

    const isMember = await Group.findByPk(group_id, {
      include: {
        association: 'members',
        where: { id: user_id },
      },
    });
    if (!isMember)
      return res
        .status(400)
        .json({ error: 'User is not a member of this group' });

    const isAdministrator = await Group.findOne({
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

    if (!isAdministrator && !isModerator)
      return res.status(401).json({
        error:
          ' Invalid action. Only the group admin or moderators can remove bans.',
      });

    if (user.id === req.userId)
      return res.status(401).json({ error: 'you can not remove yourself' });

    if (isModerator) {
      const moderatorBeingBanned = await Group.findOne({
        where: { id: group_id },
        include: {
          association: 'moderators',
          where: { id: user.id },
        },
      });
      if (moderatorBeingBanned)
        return res
          .status(401)
          .json({ error: 'A moderator can not remove another moderator.' });
    }

    if (user.id === isAdministrator.owner_id)
      return res
        .status(401)
        .json({ error: 'Not permitted to remove the group owner.' });

    await group.removeMember(user);

    return res.status(200).json({ msg: 'User successfully removed' });
  }
}

export default new GroupMembersController();
