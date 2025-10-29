import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "recommendation";
/** Request message for course recommendations */
export interface RecommendationRequest {
    /** Array of topics (e.g., ["JavaScript", "React"]) */
    topics: string[];
    /** Skill level: "beginner", "intermediate", "advanced" */
    skill_level: string;
    /** Optional: preferred duration (e.g., "short", "long") */
    preferred_duration: string;
    /** Number of recommendations to return (default: 5) */
    limit: number;
}
/** Single course recommendation */
export interface CourseRecommendation {
    title: string;
    description: string;
    category: string;
    skill_level: string;
    duration: string;
    instructor: string;
    /** 0-1 score indicating relevance */
    relevance_score: number;
    /** Matching topics */
    topics: string[];
}
/** Response message with recommendations */
export interface RecommendationResponse {
    recommendations: CourseRecommendation[];
    message: string;
    total_count: number;
}
export declare const RecommendationRequest: MessageFns<RecommendationRequest>;
export declare const CourseRecommendation: MessageFns<CourseRecommendation>;
export declare const RecommendationResponse: MessageFns<RecommendationResponse>;
/** Recommendation Service */
export type RecommendationServiceService = typeof RecommendationServiceService;
export declare const RecommendationServiceService: {
    /** Get course recommendations based on user preferences */
    readonly getRecommendations: {
        readonly path: "/recommendation.RecommendationService/GetRecommendations";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: RecommendationRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => RecommendationRequest;
        readonly responseSerialize: (value: RecommendationResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => RecommendationResponse;
    };
};
export interface RecommendationServiceServer extends UntypedServiceImplementation {
    /** Get course recommendations based on user preferences */
    getRecommendations: handleUnaryCall<RecommendationRequest, RecommendationResponse>;
}
export interface RecommendationServiceClient extends Client {
    /** Get course recommendations based on user preferences */
    getRecommendations(request: RecommendationRequest, callback: (error: ServiceError | null, response: RecommendationResponse) => void): ClientUnaryCall;
    getRecommendations(request: RecommendationRequest, metadata: Metadata, callback: (error: ServiceError | null, response: RecommendationResponse) => void): ClientUnaryCall;
    getRecommendations(request: RecommendationRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: RecommendationResponse) => void): ClientUnaryCall;
}
export declare const RecommendationServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): RecommendationServiceClient;
    service: typeof RecommendationServiceService;
    serviceName: string;
};
type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;
export type DeepPartial<T> = T extends Builtin ? T : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : T extends {} ? {
    [K in keyof T]?: DeepPartial<T[K]>;
} : Partial<T>;
type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P : P & {
    [K in keyof P]: Exact<P[K], I[K]>;
} & {
    [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
};
export interface MessageFns<T> {
    encode(message: T, writer?: BinaryWriter): BinaryWriter;
    decode(input: BinaryReader | Uint8Array, length?: number): T;
    fromJSON(object: any): T;
    toJSON(message: T): unknown;
    create<I extends Exact<DeepPartial<T>, I>>(base?: I): T;
    fromPartial<I extends Exact<DeepPartial<T>, I>>(object: I): T;
}
export {};
//# sourceMappingURL=recommendation.d.ts.map