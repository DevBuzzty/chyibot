import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export class Sandbox {
  private containerName: string;
  private image: string = 'node:20-slim';

  constructor(private sessionId: string, private workspace: string) {
    this.containerName = `chyi-sandbox-${sessionId}`;
  }

  async exec(command: string) {
    console.log(`Executing in sandbox [${this.sessionId}]: ${command}`);

    const dockerCmd = `docker run --rm \
      --name ${this.containerName} \
      -v ${path.resolve(this.workspace)}:/workspace \
      -w /workspace \
      ${this.image} \
      bash -c ${JSON.stringify(command)}`;

    try {
      const { stdout, stderr } = await execPromise(dockerCmd);
      return { stdout, stderr };
    } catch (e: any) {
      return { error: e.message, stdout: e.stdout, stderr: e.stderr };
    }
  }
}
