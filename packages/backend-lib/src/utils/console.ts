import  pc from 'picocolors'

export default class Logger {

  public static error(...input: any[]) {
    console.error(pc.red(input.join(' ')));
  }
  public static warn(...input: any[]) {
    console.warn(pc.yellow(input.join(' ')));
  }
  public static info(...input:any[]) {
    console.info(pc.blue(input.join(' ')));
  }
  public static debug(...input: any[]) {
    console.debug(pc.gray(input.join(' ')));
  }

  public static success(...input: any[]) {
    console.log(pc.green(input.join(' ')));
  }
}
