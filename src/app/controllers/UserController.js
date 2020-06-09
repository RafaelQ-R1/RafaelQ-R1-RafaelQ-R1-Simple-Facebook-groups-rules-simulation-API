import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email().required(),
      permitted_to_add_in_groups: Yup.boolean().required(),
      password: Yup.string().required().min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const { id, name, email, permitted_to_add_in_groups } = await User.create(
      req.body
    );

    return res.json({
      id,
      name,
      email,
      permitted_to_add_in_groups,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      permitted_to_add_in_groups: Yup.boolean(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });
      if (userExists) {
        return res.status(400).json({ error: 'User already exists' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    const { id, name, permitted_to_add_in_groups } = await user.update(
      req.body
    );

    return res.json({
      id,
      name,
      email,
      permitted_to_add_in_groups,
    });
  }

  async index(req, res) {
    const findUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'permitted_to_add_in_groups'],
      order: ['id'],
      include: [
        {
          association: 'groups',
          attributes: ['id', 'name'],
          order: ['name'],
        },
      ],
    });
    if (!findUsers) return res.status(400).json({ error: 'No users found' });

    return res.status(200).json(findUsers);
  }

  async show(req, res) {
    const { user_id } = req.params;
    const findUser = await User.findByPk(user_id, {
      attributes: ['id', 'name', 'email', 'permitted_to_add_in_groups'],
      order: ['id'],
    });

    if (!findUser) return res.status(400).json({ error: 'User not  found' });

    return res.status(200).json(findUser);
  }

  async delete(req, res) {
    await User.destroy({
      where: { id: req.userId },
    });

    return res
      .status(200)
      .json({ msg: 'your account was successfully removed' });
  }
}

export default new UserController();
