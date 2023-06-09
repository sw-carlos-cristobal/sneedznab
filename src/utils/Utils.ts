import picocolors from 'picocolors';
const { cyan, magenta } = picocolors;

export class Utils {
  constructor() {
    throw new Error('Utils is a static class and should not be instantiated.');
  }

  static debugLog = (name: string, context: string, message: string): void => {
    if (!process.env.DEBUG) return;

    console.log(`>> ${magenta(name)} (${cyan(context)}): ${message}`);
  };

  static formatDate = (timestamp: Date | string | number): string => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    const hours =
      date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
    const minutes =
      date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
    const seconds =
      date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();

    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
  };
}
