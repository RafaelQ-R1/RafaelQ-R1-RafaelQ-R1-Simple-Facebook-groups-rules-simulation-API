import User from '../models/User';
import Group from '../models/Group';

class GroupRequestEntryController {
  async create(req, res) {
    const { group_id } = req.params;

    const user = await User.findByPk(req.userId);

    const group = await Group.findByPk(group_id);

    if (!group) return res.status(401).json({ error: 'Group do not exists' });

    const isBanned = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'bans',
        where: { id: req.userId },
        required: true,
      },
    });
    if (isBanned)
      return res.status(401).json({
        error:
          'You are not allowed to request access. You have been banned from that group.',
      });

    const isMember = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'members',
        where: { id: req.userId },
        required: true,
      },
    });
    if (isMember)
      return res
        .status(401)
        .json({ error: 'You already are a member of this group' });

    if (group.is_private) {
      const requestEntry = await Group.findOne({
        where: { id: group_id },
        include: {
          association: 'requesters',
          where: { id: req.userId },
          required: true,
        },
      });
      if (requestEntry)
        return res.status(401).json({
          error:
            'You have already applied to join this group. Wait for an administrator to accept your request',
        });

      const createRequestEntry = await group.addRequester(user);

      return res.status(202).json({
        msg:
          'your request is already sent. Wait until an administrator of this group accept your request',
        request: createRequestEntry.id,
        requester: createRequestEntry.requester_id,
        group: createRequestEntry.group_id,
      });
    }

    const enterInGroup = await group.addMember(user);

    return res.status(201).json(enterInGroup);
  }

  async delete(req, res) {
    const { group_id, user_id } = req.params;

    const groupExists = await Group.findByPk(group_id);

    if (!groupExists)
      return res.status(404).json({ error: 'Group do not exists' });

    const requestExists = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'requesters',
        where: { id: user_id },
        required: true,
      },
    });

    if (!requestExists)
      return res.status(400).json({ error: 'Request do not exists' });

    const isRequester = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'requesters',
        where: { id: req.userId },
        required: true,
      },
    });

    const isModerator = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'moderators',
        where: { id: req.userId },
      },
    });

    const isAdministrator = await Group.findOne({
      where: { id: group_id },
    });

    if (!isRequester && !isModerator && !isAdministrator)
      return res.status(401).json({
        invalid_request: `Only the the requester or the Administrator and a Moderator of the group can do this action. `,
      });

    const user = await User.findByPk(user_id);
    await groupExists.removeRequester(user);

    return res.status(200).json({ msg: 'Request successfully canceled.' });
  }

  async index(req, res) {
    const { group_id } = req.params;

    const groupExists = await Group.findByPk(group_id);
    if (!groupExists)
      return res.status(400).json({ error: 'Group does not exists' });

    const isModerator = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'moderators',
        where: { id: req.userId },
      },
    });

    const isAdministrator = await Group.findOne({
      where: { id: group_id, owner_id: req.userId },
    });

    if (!isAdministrator && !isModerator)
      return res
        .status(401)
        .json({ error: 'You are not allowed to do this action' });

    const findAllRequests = await Group.findAll({
      where: { id: group_id },
      include: {
        association: 'requesters',
        required: true,
      },
    });

    if (!findAllRequests)
      return res
        .status(400)
        .json({ error: "This group do not have requests entry's." });

    return res.json(findAllRequests);
  }

  async update(req, res) {
    const { group_id, user_id } = req.params;
    const groupExists = await Group.findByPk(group_id);

    if (!groupExists)
      return res
        .status(400)
        .json({ error: 'Group of this request not exists' });

    const isRequester = Group.findOne({
      where: { id: group_id },
      include: {
        association: 'members',
        where: { id: req.userId },
        required: true,
      },
    });

    const isModerator = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'moderators',
        where: { id: req.userId },
        required: true,
      },
    });

    const isAdministrator = await Group.findOne({
      where: { id: group_id },
      include: {
        association: 'administrators',
        where: { id: req.userId },
        required: true,
      },
    });
    if (!isRequester && !isModerator && !isAdministrator)
      return res
        .status(401)
        .json({ error: 'you are not allowed to do this action' });

    if (isModerator || isAdministrator) {
      const userExists = await User.findByPk(user_id);

      if (!userExists)
        return res.status(400).json({ error: 'User do not exists' });

      const { acceptRequest, denyRequest } = req.body;

      if (acceptRequest) {
        const findRequest = await Group.findOne({
          where: { id: group_id },
          include: {
            association: 'requesters',
            where: { id: user_id },
            required: true,
          },
        });

        if (!findRequest)
          return res.status(400).json({ error: 'Request do not exists' });

        await groupExists.removeRequest(userExists);

        const createMember = await groupExists.addMember(userExists);

        return res.status(201).json(createMember);
      }
      if (denyRequest) {
        await groupExists.removeRequest(userExists);

        return res.status(200).json({ msg: 'request canceled' });
      }
    }
    return res.status(200);
  }
}
export default new GroupRequestEntryController();
