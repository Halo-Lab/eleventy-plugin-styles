import chalk, { Chalk } from 'chalk';

/** Convert Error to string. */
const errorToString = (error: Error) =>
  error.name + ': ' + error.message + '\n' + error.stack;

/**
 * Log _message_ binded with _name_ of the process
 * to teminal.
 *
 * @param paint - function that paint _message_.
 * @param name of the process.
 * @param message
 * @param emoji - just for fun :)
 */
const log = (
  paint: Chalk,
  name: string,
  message: string | Error,
  emoji: string
) =>
  console.info(
    ' ' +
      chalk.bgYellowBright(new Date().toLocaleTimeString()) +
      ' -> ' +
      chalk.bold.gray(name) +
      ': ' +
      paint(message instanceof Error ? errorToString(message) : message) +
      ' ' +
      emoji
  );

/**
 * Alert about starting of process.
 *
 * @param name of the process that starts execution.
 * @param message
 */
export const start = (name: string, message: string) =>
  log(chalk.green, name, message, '🆙');

/**
 * Alert about successful ending of process.
 *
 * @param name of the process that ends execution.
 * @param message
 */
export const done = (name: string, message: string) =>
  log(chalk.magenta, name, message, '🙌');

/**
 * Alert about error that was occured during process execution.
 *
 * @param name of the proess that finishes with error.
 * @param message
 */
export const oops = (name: string, message: string | Error) =>
  log(chalk.red, name, message, '💥');
