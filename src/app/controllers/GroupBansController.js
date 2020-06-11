import Group from '../models/Group';
import User from '../models/User';

class GroupBansController {
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
        error: 'Only the admin or a moderator can ban a member',
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
    if (!isMember)
      return res.status(401).json({
        error: 'User is not a member of this group ',
      });

    if (userExists.id === req.userId)
      return res.status(401).json({ error: 'you can not ban yourself' });

    if (isModerator) {
      const moderatorBeingBanned = await Group.findOne({
        where: { id: group_id },
        include: {
          association: 'moderators',
          where: { id: userExists.id },
        },
      });
      if (moderatorBeingBanned)
        return res
          .status(401)
          .json({ error: 'A moderator can not ban another moderator' });
    }

    if (userExists.id === groupExists.owner_id)
      return res
        .status(401)
        .json({ error: 'Not permitted to ban the group owner' });

    const isBanned = await Group.findOne({
      where: { id: group_id },
      include: [
        {
          association: 'bans',
          attributes: ['id', 'name'],
          where: {
            id: user_id,
          },
        },
      ],
    });
    if (isBanned)
      return res.status(401).json({
        error: 'User are already banned of this group',
      });

    await groupExists.removeMember(userExists);

    const bannedMember = await groupExists.addBan(userExists);

    return res.status(201).json(bannedMember);
  }

  async index(req, res) {
    const { group_id } = req.params;

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
          ' Invalid action. Only the group admin or moderators can see this content',
      });

    const findBans = await Group.findByPk(group_id, {
      include: {
        association: 'bans',
        attributes: ['id', 'name', 'permitted_to_add_in_groups'],
        order: ['id'],
      },
    });

    if (!findBans)
      return res.status(400).json({ error: 'Group does not exists' });

    return res.status(200).json(findBans);
  }

  async show(req, res) {
    const { group_id, user_id } = req.params;

    const isAdministrator = await Group.findOne({
      where: { id: group_id, owner_id: req.userId },
    });

    const isModerator = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'moderators',
        where: { id: req.userId },
      },
    });

    if (!isAdministrator && !isModerator)
      return res.status(401).json({
        error:
          ' Invalid action. Only the group admin or moderators can see this content',
      });

    const findBanned = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'bans',
        where: { id: user_id },
        attributes: ['id', 'name', 'permitted_to_add_in_groups'],
        order: ['id'],
        required: true,
      },
    });

    if (!findBanned)
      return res.status(400).json({ error: 'Ban register does not exists' });

    return res.status(200).json(findBanned);
  }

  async delete(req, res) {
    const { group_id, user_id } = req.params;

    const userExists = await User.findByPk(user_id);
    if (!userExists)
      return res.status(400).json({ error: 'User does not exists' });

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

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

    const banExists = await Group.findByPk(group_id, {
      include: { association: 'bans', where: { id: user_id } },
    });

    if (!banExists)
      return res.status(400).json({ error: 'This user are not banned' });

    if (!isAdministrator && !isModerator)
      return res.status(401).json({
        error:
          ' Invalid action. Only the group admin or moderators can remove bans',
      });

    const userBanned = await groupExists.getBans({ where: { id: user_id } });

    await groupExists.removeBan(userBanned);

    return res.status(200).json({
      msg: `The ban of user ${userExists.name} was successfully removed`,
    });
  }
}

export default new GroupBansController();
