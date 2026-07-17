import "@fastify/jwt";
import "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: number;
      name: string;
      email: string;
      friendCode: string;
    };
    user: {
      id: number;
      name: string;
      email: string;
      friendCode: string;
    };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    // Untuk token akses biasa (via request.user)
    user: {
      id: number;
      name: string;
      email: string;
      friendCode: string;
    };
    // Tambahkan ini agar request.refreshUser dikenali TypeScript tanpa error
    refreshUser: {
      id: number;
      name: string;
      email: string;
      friendCode: string;
    };
  }
}
