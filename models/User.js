const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  photo: {
    field: 'photo',
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isString(value) {
        if (value != null && typeof value !== 'string') {
          throw new Error('Photo must be a string representing a file path or URL');
        }
      },
      isFile(value) {
        if (value != null && !(/\.(jpe?g|png|gif|bmp|webp|svg|heic|pdf|docx?|xlsx?|pptx?)$/i).test(value)) {
          throw new Error('Photo must be a valid file path or URL to an accepted file type');
        }
      }
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'manager'),
    allowNull: false,
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  },
  defaultScope: {
    attributes: {
      exclude: ['password']
    }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

module.exports = User;
