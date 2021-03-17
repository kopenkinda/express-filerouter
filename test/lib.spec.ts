import path from 'path';
import ExpressFilerouter from '../src/lib';

const TEST_FOLDER_BAD = path.join(process.cwd(), 'test', 'routes_bad');
const TEST_FOLDER_GOOD = path.join(process.cwd(), 'test', 'routes_good');
const TEST_PREFIX = '/';

const badRouter = new ExpressFilerouter({
  folder: TEST_FOLDER_BAD,
  prefix: TEST_PREFIX,
});

const goodRouter = new ExpressFilerouter({
  folder: TEST_FOLDER_GOOD,
  prefix: TEST_PREFIX,
});

describe('Tests', () => {
  it('Should read file-structure properly', () => {
    expect(goodRouter.getFileStructure()).toEqual([
      `${TEST_FOLDER_GOOD}/:id/route2.ts`,
      `${TEST_FOLDER_GOOD}/route1.ts`,
    ]);
  });
  it('Should parse file-structure properly', () => {
    expect(goodRouter.getParsedStructure()).toEqual([
      {
        file: `${TEST_FOLDER_GOOD}/:id/route2.ts`,
        path: `${TEST_PREFIX}:id/route2`,
      },
      {
        file: `${TEST_FOLDER_GOOD}/route1.ts`,
        path: `${TEST_PREFIX}route1`,
      },
    ]);
  });
  it('Should throw an error on malformed route', () => {
    expect(badRouter.loadModules()).rejects.toThrowError();
  });

  it('Should properly import routes', () => {
    expect(goodRouter.loadModules()).resolves.not.toThrowError();
  });
});
