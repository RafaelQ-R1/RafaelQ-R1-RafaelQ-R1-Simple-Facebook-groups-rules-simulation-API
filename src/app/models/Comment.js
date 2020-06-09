import { Model, Sequelize } from 'sequelize';

class Comment extends Model {
  static init(sequelize) {
    super.init(
      {
        body: Sequelize.STRING,
        author_id: Sequelize.INTEGER,
        topic_id: Sequelize.INTEGER,
      },
      {
        sequelize,
        tableName: 'comments',
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Topic, { foreignKey: 'topic_id', as: 'topic' });
    this.belongsTo(models.User, { foreignKey: 'author_id', as: 'author' });
  }
}

export default Comment;
