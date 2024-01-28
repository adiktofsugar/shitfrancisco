/* eslint-disable import/prefer-default-export */
import PropTypes from "prop-types";

const Post = PropTypes.shape({
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  date: PropTypes.number.isRequired,
});

export { Post };
