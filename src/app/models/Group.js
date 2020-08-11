import { Model, Sequelize } from 'sequelize';

class Group extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        is_private: Sequelize.BOOLEAN,
      },
      {
        sequelize,
        tableName: 'groups',
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'administrator',
    });

    this.hasMany(models.Topic, { foreignKey: 'group_id', as: 'topics' });

    this.belongsToMany(models.User, {
      foreignKey: 'group_id',
      through: 'groups_members',
      as: 'members',
    });

    this.belongsToMany(models.User, {
      foreignKey: 'group_id',
      through: 'groups_bans',
      as: 'bans',
    });

    this.belongsToMany(models.User, {
      foreignKey: 'group_id',
      through: 'groups_moderators',
      as: 'moderators',
    });

    this.belongsToMany(models.User, {
      foreignKey: 'group_id',
      through: 'request_entrys',
      as: 'requesters',
    });
  }
}

export default Group;
