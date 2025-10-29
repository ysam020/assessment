import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { type CallOptions, type ChannelCredentials, Client, type ClientOptions, type ClientUnaryCall, type handleUnaryCall, type Metadata, type ServiceError, type UntypedServiceImplementation } from "@grpc/grpc-js";
export declare const protobufPackage = "course";
export interface CourseUploadRequest {
    courses: CourseData[];
}
export interface CourseData {
    course_id: string;
    title: string;
    description: string;
    category: string;
    instructor: string;
    duration: string;
    /** beginner, intermediate, advanced */
    skill_level: string;
    tags: string[];
}
export interface CourseUploadResponse {
    success: boolean;
    message: string;
    courses_uploaded: number;
    courses_indexed: number;
}
export interface CourseSearchRequest {
    /** Search keyword */
    query: string;
    /** Filter by category */
    category: string;
    /** Filter by instructor */
    instructor: string;
    /** Filter by skill level */
    skill_level: string;
    /** Number of results (default: 10) */
    limit: number;
    /** Pagination offset */
    offset: number;
}
export interface Course {
    id: string;
    course_id: string;
    title: string;
    description: string;
    category: string;
    instructor: string;
    duration: string;
    skill_level: string;
    tags: string[];
    /** Elasticsearch score */
    relevance_score: number;
}
export interface CourseSearchResponse {
    courses: Course[];
    total_count: number;
    message: string;
    /** Indicates if result is from cache */
    from_cache: boolean;
}
export interface CourseGetRequest {
    course_id: string;
}
export interface CourseGetResponse {
    course?: Course | undefined;
    message: string;
    from_cache: boolean;
}
export declare const CourseUploadRequest: MessageFns<CourseUploadRequest>;
export declare const CourseData: MessageFns<CourseData>;
export declare const CourseUploadResponse: MessageFns<CourseUploadResponse>;
export declare const CourseSearchRequest: MessageFns<CourseSearchRequest>;
export declare const Course: MessageFns<Course>;
export declare const CourseSearchResponse: MessageFns<CourseSearchResponse>;
export declare const CourseGetRequest: MessageFns<CourseGetRequest>;
export declare const CourseGetResponse: MessageFns<CourseGetResponse>;
export type CourseServiceService = typeof CourseServiceService;
export declare const CourseServiceService: {
    /** Upload courses from CSV data */
    readonly uploadCourses: {
        readonly path: "/course.CourseService/UploadCourses";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CourseUploadRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CourseUploadRequest;
        readonly responseSerialize: (value: CourseUploadResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CourseUploadResponse;
    };
    /** Search courses using Elasticsearch */
    readonly searchCourses: {
        readonly path: "/course.CourseService/SearchCourses";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CourseSearchRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CourseSearchRequest;
        readonly responseSerialize: (value: CourseSearchResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CourseSearchResponse;
    };
    /** Get course by ID (with Redis caching) */
    readonly getCourse: {
        readonly path: "/course.CourseService/GetCourse";
        readonly requestStream: false;
        readonly responseStream: false;
        readonly requestSerialize: (value: CourseGetRequest) => Buffer;
        readonly requestDeserialize: (value: Buffer) => CourseGetRequest;
        readonly responseSerialize: (value: CourseGetResponse) => Buffer;
        readonly responseDeserialize: (value: Buffer) => CourseGetResponse;
    };
};
export interface CourseServiceServer extends UntypedServiceImplementation {
    /** Upload courses from CSV data */
    uploadCourses: handleUnaryCall<CourseUploadRequest, CourseUploadResponse>;
    /** Search courses using Elasticsearch */
    searchCourses: handleUnaryCall<CourseSearchRequest, CourseSearchResponse>;
    /** Get course by ID (with Redis caching) */
    getCourse: handleUnaryCall<CourseGetRequest, CourseGetResponse>;
}
export interface CourseServiceClient extends Client {
    /** Upload courses from CSV data */
    uploadCourses(request: CourseUploadRequest, callback: (error: ServiceError | null, response: CourseUploadResponse) => void): ClientUnaryCall;
    uploadCourses(request: CourseUploadRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CourseUploadResponse) => void): ClientUnaryCall;
    uploadCourses(request: CourseUploadRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CourseUploadResponse) => void): ClientUnaryCall;
    /** Search courses using Elasticsearch */
    searchCourses(request: CourseSearchRequest, callback: (error: ServiceError | null, response: CourseSearchResponse) => void): ClientUnaryCall;
    searchCourses(request: CourseSearchRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CourseSearchResponse) => void): ClientUnaryCall;
    searchCourses(request: CourseSearchRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CourseSearchResponse) => void): ClientUnaryCall;
    /** Get course by ID (with Redis caching) */
    getCourse(request: CourseGetRequest, callback: (error: ServiceError | null, response: CourseGetResponse) => void): ClientUnaryCall;
    getCourse(request: CourseGetRequest, metadata: Metadata, callback: (error: ServiceError | null, response: CourseGetResponse) => void): ClientUnaryCall;
    getCourse(request: CourseGetRequest, metadata: Metadata, options: Partial<CallOptions>, callback: (error: ServiceError | null, response: CourseGetResponse) => void): ClientUnaryCall;
}
export declare const CourseServiceClient: {
    new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): CourseServiceClient;
    service: typeof CourseServiceService;
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
//# sourceMappingURL=course.d.ts.map