/* eslint-disable class-methods-use-this */
export class MockServerHelper {
  /**
   * Returns random integer between min and max.
   * @param min Minimum value that is used for calculation
   * @param max Maximum value that is used for calculation
   */
  getRandomInt(min = 0, max = 2147483648): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

const mockServerHelper = new MockServerHelper();

export default mockServerHelper;
