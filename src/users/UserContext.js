import { createContext } from "react";

/**
 * @typedef {object} UserContext
 * @property {string} token
 * @property {number} expiration
 */
export default createContext(/** @type {UserContext | null} */ (null));
