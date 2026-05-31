import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * The `Date` scalar type represents a date. The Date appears in a JSON
   * response as an ISO8601 formatted string, without a time component.
   */
  Date: { input: any; output: any; }
  /**
   * The `DateTime` scalar type represents a date and time in the UTC
   * timezone. The DateTime appears in a JSON response as an ISO8601 formatted
   * string, including UTC timezone ("Z"). The parsed date and time string will
   * be converted to UTC if there is an offset.
   */
  DateTime: { input: any; output: any; }
  /**
   * The `Time` scalar type represents a time. The Time appears in a JSON
   * response as an ISO8601 formatted string, without a date component.
   */
  Time: { input: any; output: any; }
};

export type CreateElementInput = {
  completed: Scalars['Boolean']['input'];
  description: Scalars['String']['input'];
  icon: Scalars['String']['input'];
  labels?: InputMaybe<Array<Scalars['String']['input']>>;
  location?: InputMaybe<LocationInput>;
  name: Scalars['String']['input'];
  schedule?: InputMaybe<ScheduleInput>;
  tripIds?: InputMaybe<Array<Scalars['String']['input']>>;
  uri: Scalars['String']['input'];
};

export type CreatePermissionInput = {
  isPublic: Scalars['Boolean']['input'];
  permit: Array<PermitType>;
  tripId: Scalars['String']['input'];
};

export type CreateTripInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  timeZone?: InputMaybe<Scalars['String']['input']>;
};

export type Element = {
  __typename?: 'Element';
  completed: Scalars['Boolean']['output'];
  description: Scalars['String']['output'];
  icon: Scalars['String']['output'];
  id: Scalars['String']['output'];
  labels: Array<Scalars['String']['output']>;
  location?: Maybe<Location>;
  name: Scalars['String']['output'];
  photos: Array<Photo>;
  schedule?: Maybe<Schedule>;
  trips: Array<Trip>;
  uri: Scalars['String']['output'];
};

export type ElementInput = {
  completed: Scalars['Boolean']['input'];
  description: Scalars['String']['input'];
  icon: Scalars['String']['input'];
  id: Scalars['String']['input'];
  labels?: InputMaybe<Array<Scalars['String']['input']>>;
  location?: InputMaybe<LocationInput>;
  name: Scalars['String']['input'];
  schedule?: InputMaybe<ScheduleInput>;
  tripIds?: InputMaybe<Array<Scalars['String']['input']>>;
  uri: Scalars['String']['input'];
};

export type FileUploadUrl = {
  __typename?: 'FileUploadUrl';
  key: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type GeoBounds = {
  bottom: Scalars['Float']['input'];
  left: Scalars['Float']['input'];
  right: Scalars['Float']['input'];
  top: Scalars['Float']['input'];
};

export type GeoPoint = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
};

export type GooglePlace = {
  __typename?: 'GooglePlace';
  address: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  placeId: Scalars['String']['output'];
  rating?: Maybe<Scalars['Float']['output']>;
  types?: Maybe<Array<Scalars['String']['output']>>;
  url?: Maybe<Scalars['String']['output']>;
  website?: Maybe<Scalars['String']['output']>;
};

/** How a list of labels is matched against an element's labels */
export enum LabelMatchMode {
  /** Element has every one of the given labels */
  All = 'ALL',
  /** Element has at least one of the given labels */
  Any = 'ANY'
}

export type Location = {
  __typename?: 'Location';
  address: Scalars['String']['output'];
  id: Scalars['String']['output'];
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
  placeId?: Maybe<Scalars['String']['output']>;
};

export type LocationInput = {
  address: Scalars['String']['input'];
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  placeId?: InputMaybe<Scalars['String']['input']>;
};

export type LoginInput = {
  /** Optional human-readable label for this session (e.g. "iPhone 15"). Displayed in the session list. */
  deviceLabel?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type LoginToken = {
  __typename?: 'LoginToken';
  accessToken: Scalars['String']['output'];
  /** Absolute expiration time of the access token. */
  expiresAt: Scalars['DateTime']['output'];
  refreshToken: Scalars['String']['output'];
  user: User;
};

export type LogoutInput = {
  refreshToken: Scalars['String']['input'];
};

export type LogoutSuccess = {
  __typename?: 'LogoutSuccess';
  success: Scalars['Boolean']['output'];
};

export type Permission = {
  __typename?: 'Permission';
  id: Scalars['String']['output'];
  isPublic: Scalars['Boolean']['output'];
  permit: Array<PermitType>;
  trip: Trip;
};

export type PermissionInput = {
  id: Scalars['String']['input'];
  isPublic: Scalars['Boolean']['input'];
  permit: Array<PermitType>;
};

export enum PermitType {
  Read = 'READ',
  Write = 'WRITE'
}

export type Photo = {
  __typename?: 'Photo';
  attributionUrl?: Maybe<Scalars['String']['output']>;
  creditName?: Maybe<Scalars['String']['output']>;
  creditUrl?: Maybe<Scalars['String']['output']>;
  description: Scalars['String']['output'];
  full: Scalars['String']['output'];
  id: Scalars['String']['output'];
  license?: Maybe<Scalars['String']['output']>;
  regular: Scalars['String']['output'];
  small: Scalars['String']['output'];
  storageKey?: Maybe<Scalars['String']['output']>;
  thumbnail: Scalars['String']['output'];
  type?: Maybe<PhotoType>;
};

export type PhotoResult = {
  __typename?: 'PhotoResult';
  attributionUrl: Scalars['String']['output'];
  urls: PhotoUrls;
  user: PhotoUser;
};

export enum PhotoType {
  S3 = 'S3',
  Unsplash = 'UNSPLASH',
  Wikimedia = 'WIKIMEDIA'
}

export type PhotoUrls = {
  __typename?: 'PhotoUrls';
  full: Scalars['String']['output'];
  raw: Scalars['String']['output'];
  regular: Scalars['String']['output'];
  small: Scalars['String']['output'];
  thumb: Scalars['String']['output'];
};

export type PhotoUser = {
  __typename?: 'PhotoUser';
  name: Scalars['String']['output'];
  portfolioUrl?: Maybe<Scalars['String']['output']>;
};

/** Restricts place search results to a category of place */
export enum PlaceGranularity {
  /** Precise street addresses only */
  Address = 'ADDRESS',
  /** Cities only (locality / administrative_area_level_3) */
  Cities = 'CITIES',
  /** Businesses and points of interest only */
  Establishment = 'ESTABLISHMENT',
  /** Countries, states, regions, and cities */
  Regions = 'REGIONS'
}

export type RegisterInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type RegisterSuccess = {
  __typename?: 'RegisterSuccess';
  success: Scalars['Boolean']['output'];
};

export type RenewTokenInput = {
  refreshToken: Scalars['String']['input'];
};

export type ResetPasswordInput = {
  confirmPassword: Scalars['String']['input'];
  password: Scalars['String']['input'];
  token: Scalars['String']['input'];
};

export type RevokeAllOtherSessionsPayload = {
  __typename?: 'RevokeAllOtherSessionsPayload';
  revokedCount: Scalars['Int']['output'];
};

export type RevokeSessionInput = {
  id: Scalars['String']['input'];
};

export type RevokeSessionPayload = {
  __typename?: 'RevokeSessionPayload';
  /** True if the revoked session was the one used to make this request. Client should discard its tokens. */
  currentSessionRevoked: Scalars['Boolean']['output'];
  revokedCount: Scalars['Int']['output'];
};

export type RootMutationType = {
  __typename?: 'RootMutationType';
  confirmAccount: Scalars['String']['output'];
  createElement: Element;
  createPermission: Permission;
  createS3Photo: Photo;
  createTrip: Trip;
  createUnsplashPhoto: Photo;
  deleteElement: Element;
  deletePermission: Permission;
  deleteTrip: Trip;
  forgotPassword: Scalars['String']['output'];
  importElement: Element;
  importElementAsync: Scalars['Boolean']['output'];
  login: LoginToken;
  logout: LogoutSuccess;
  register: RegisterSuccess;
  renewToken: LoginToken;
  resendConfirmation: Scalars['String']['output'];
  resetPassword: Scalars['String']['output'];
  revokeAllOtherSessions: RevokeAllOtherSessionsPayload;
  revokeSession: RevokeSessionPayload;
  updateElement: Element;
  updatePermission: Permission;
  updateTrip: Trip;
};


export type RootMutationTypeConfirmAccountArgs = {
  key: Scalars['String']['input'];
};


export type RootMutationTypeCreateElementArgs = {
  input: CreateElementInput;
};


export type RootMutationTypeCreatePermissionArgs = {
  input: CreatePermissionInput;
};


export type RootMutationTypeCreateS3PhotoArgs = {
  input: S3PhotoInput;
};


export type RootMutationTypeCreateTripArgs = {
  input: CreateTripInput;
};


export type RootMutationTypeCreateUnsplashPhotoArgs = {
  input: UnsplashPhotoInput;
};


export type RootMutationTypeDeleteElementArgs = {
  id: Scalars['String']['input'];
};


export type RootMutationTypeDeletePermissionArgs = {
  id: Scalars['String']['input'];
};


export type RootMutationTypeDeleteTripArgs = {
  id: Scalars['String']['input'];
};


export type RootMutationTypeForgotPasswordArgs = {
  email: Scalars['String']['input'];
};


export type RootMutationTypeImportElementArgs = {
  url: Scalars['String']['input'];
};


export type RootMutationTypeImportElementAsyncArgs = {
  url: Scalars['String']['input'];
};


export type RootMutationTypeLoginArgs = {
  input: LoginInput;
};


export type RootMutationTypeLogoutArgs = {
  input: LogoutInput;
};


export type RootMutationTypeRegisterArgs = {
  input: RegisterInput;
};


export type RootMutationTypeRenewTokenArgs = {
  input: RenewTokenInput;
};


export type RootMutationTypeResendConfirmationArgs = {
  email: Scalars['String']['input'];
};


export type RootMutationTypeResetPasswordArgs = {
  input: ResetPasswordInput;
};


export type RootMutationTypeRevokeSessionArgs = {
  input: RevokeSessionInput;
};


export type RootMutationTypeUpdateElementArgs = {
  input: ElementInput;
};


export type RootMutationTypeUpdatePermissionArgs = {
  input: PermissionInput;
};


export type RootMutationTypeUpdateTripArgs = {
  input: TripInput;
};

export type RootQueryType = {
  __typename?: 'RootQueryType';
  createUploadUrl: FileUploadUrl;
  element: Element;
  elements: Array<Element>;
  myUser: User;
  permission: Permission;
  photoSearch: Array<PhotoResult>;
  placeSearch: Array<GooglePlace>;
  sessions: Array<Session>;
  trip: Trip;
  trips: Array<Trip>;
};


export type RootQueryTypeCreateUploadUrlArgs = {
  bustCache?: InputMaybe<Scalars['Int']['input']>;
};


export type RootQueryTypeElementArgs = {
  id: Scalars['String']['input'];
};


export type RootQueryTypeElementsArgs = {
  afterDate?: InputMaybe<Scalars['DateTime']['input']>;
  bounds?: InputMaybe<GeoBounds>;
  completed?: InputMaybe<Scalars['Boolean']['input']>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  excludeTripId?: InputMaybe<Scalars['String']['input']>;
  hasSchedule?: InputMaybe<Scalars['Boolean']['input']>;
  labels?: InputMaybe<Array<Scalars['String']['input']>>;
  labelsMatch?: InputMaybe<LabelMatchMode>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortLocation?: InputMaybe<GeoPoint>;
  tripId?: InputMaybe<Scalars['String']['input']>;
};


export type RootQueryTypePermissionArgs = {
  id: Scalars['String']['input'];
};


export type RootQueryTypePhotoSearchArgs = {
  query: Scalars['String']['input'];
};


export type RootQueryTypePlaceSearchArgs = {
  granularity?: InputMaybe<PlaceGranularity>;
  query: Scalars['String']['input'];
};


export type RootQueryTypeTripArgs = {
  id: Scalars['String']['input'];
};


export type RootQueryTypeTripsArgs = {
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type S3PhotoInput = {
  description: Scalars['String']['input'];
  storageKey: Scalars['String']['input'];
};

export type Schedule = {
  __typename?: 'Schedule';
  allDay: Scalars['Boolean']['output'];
  endDate: Scalars['Date']['output'];
  endTime?: Maybe<Scalars['Time']['output']>;
  endTz: Scalars['String']['output'];
  id: Scalars['String']['output'];
  startDate: Scalars['Date']['output'];
  startTime?: Maybe<Scalars['Time']['output']>;
  startTz: Scalars['String']['output'];
};

export type ScheduleInput = {
  allDay: Scalars['Boolean']['input'];
  endDate: Scalars['Date']['input'];
  endTime?: InputMaybe<Scalars['Time']['input']>;
  endTz: Scalars['String']['input'];
  startDate: Scalars['Date']['input'];
  startTime?: InputMaybe<Scalars['Time']['input']>;
  startTz: Scalars['String']['input'];
};

export type Session = {
  __typename?: 'Session';
  /** When this session was started. */
  createdAt: Scalars['DateTime']['output'];
  /** True if this session is the one used to make the current request. */
  current: Scalars['Boolean']['output'];
  deviceLabel?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  /** When the access token for this session was last refreshed. */
  lastActiveAt: Scalars['DateTime']['output'];
};

export type Trip = {
  __typename?: 'Trip';
  /** Banner photo displayed predominantly for a trip */
  bannerPhoto?: Maybe<Photo>;
  description: Scalars['String']['output'];
  elements: Array<Element>;
  icon: Scalars['String']['output'];
  id: Scalars['String']['output'];
  integrations: TripIntegrations;
  name: Scalars['String']['output'];
  permissions: Array<Permission>;
  timeZone: Scalars['String']['output'];
};

export type TripInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  timeZone?: InputMaybe<Scalars['String']['input']>;
};

export type TripIntegrations = {
  __typename?: 'TripIntegrations';
  calendarUri: Scalars['String']['output'];
  email: Scalars['String']['output'];
  publicUri?: Maybe<Scalars['String']['output']>;
};

export type UnsplashPhotoInput = {
  attributionUrl: Scalars['String']['input'];
  creditName: Scalars['String']['input'];
  creditUrl?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  full: Scalars['String']['input'];
  regular: Scalars['String']['input'];
  small: Scalars['String']['input'];
  thumbnail: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['String']['output'];
  locale?: Maybe<Scalars['String']['output']>;
};

export type ElementDetailQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ElementDetailQuery = { __typename?: 'RootQueryType', element: { __typename?: 'Element', id: string, name: string, icon: string, description: string, completed: boolean, labels: Array<string>, location?: { __typename?: 'Location', id: string, address: string, latitude: number, longitude: number } | null, photos: Array<{ __typename?: 'Photo', id: string, thumbnail: string, regular: string, description: string }>, schedule?: { __typename?: 'Schedule', id: string, allDay: boolean, startDate: any, endDate: any, startTime?: any | null, endTime?: any | null } | null } };

export type ElementsQueryVariables = Exact<{
  bounds?: InputMaybe<GeoBounds>;
  tripId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ElementsQuery = { __typename?: 'RootQueryType', elements: Array<{ __typename?: 'Element', id: string, name: string, icon: string, location?: { __typename?: 'Location', id: string, latitude: number, longitude: number } | null }> };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'RootMutationType', login: { __typename?: 'LoginToken', accessToken: string, refreshToken: string, expiresAt: any, user: { __typename?: 'User', id: string, email: string, locale?: string | null } } };

export type LogoutMutationVariables = Exact<{
  input: LogoutInput;
}>;


export type LogoutMutation = { __typename?: 'RootMutationType', logout: { __typename?: 'LogoutSuccess', success: boolean } };

export type RenewTokenMutationVariables = Exact<{
  input: RenewTokenInput;
}>;


export type RenewTokenMutation = { __typename?: 'RootMutationType', renewToken: { __typename?: 'LoginToken', accessToken: string, refreshToken: string, expiresAt: any, user: { __typename?: 'User', id: string, email: string, locale?: string | null } } };

export type SearchQueryVariables = Exact<{
  query: Scalars['String']['input'];
}>;


export type SearchQuery = { __typename?: 'RootQueryType', elements: Array<{ __typename?: 'Element', id: string, name: string, icon: string, location?: { __typename?: 'Location', id: string, address: string, latitude: number, longitude: number } | null }>, trips: Array<{ __typename?: 'Trip', id: string, name: string, icon: string, description: string }>, placeSearch: Array<{ __typename?: 'GooglePlace', placeId: string, name: string, address: string, latitude: number, longitude: number, types?: Array<string> | null }> };


export const ElementDetailDocument = gql`
    query ElementDetail($id: String!) {
  element(id: $id) {
    id
    name
    icon
    description
    completed
    labels
    location {
      id
      address
      latitude
      longitude
    }
    photos {
      id
      thumbnail
      regular
      description
    }
    schedule {
      id
      allDay
      startDate
      endDate
      startTime
      endTime
    }
  }
}
    `;

/**
 * __useElementDetailQuery__
 *
 * To run a query within a React component, call `useElementDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useElementDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useElementDetailQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useElementDetailQuery(baseOptions: Apollo.QueryHookOptions<ElementDetailQuery, ElementDetailQueryVariables> & ({ variables: ElementDetailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ElementDetailQuery, ElementDetailQueryVariables>(ElementDetailDocument, options);
      }
export function useElementDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ElementDetailQuery, ElementDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ElementDetailQuery, ElementDetailQueryVariables>(ElementDetailDocument, options);
        }
// @ts-ignore
export function useElementDetailSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ElementDetailQuery, ElementDetailQueryVariables>): Apollo.UseSuspenseQueryResult<ElementDetailQuery, ElementDetailQueryVariables>;
export function useElementDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ElementDetailQuery, ElementDetailQueryVariables>): Apollo.UseSuspenseQueryResult<ElementDetailQuery | undefined, ElementDetailQueryVariables>;
export function useElementDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ElementDetailQuery, ElementDetailQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ElementDetailQuery, ElementDetailQueryVariables>(ElementDetailDocument, options);
        }
export type ElementDetailQueryHookResult = ReturnType<typeof useElementDetailQuery>;
export type ElementDetailLazyQueryHookResult = ReturnType<typeof useElementDetailLazyQuery>;
export type ElementDetailSuspenseQueryHookResult = ReturnType<typeof useElementDetailSuspenseQuery>;
export type ElementDetailQueryResult = Apollo.QueryResult<ElementDetailQuery, ElementDetailQueryVariables>;
export const ElementsDocument = gql`
    query Elements($bounds: GeoBounds, $tripId: String) {
  elements(bounds: $bounds, tripId: $tripId) {
    id
    name
    icon
    location {
      id
      latitude
      longitude
    }
  }
}
    `;

/**
 * __useElementsQuery__
 *
 * To run a query within a React component, call `useElementsQuery` and pass it any options that fit your needs.
 * When your component renders, `useElementsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useElementsQuery({
 *   variables: {
 *      bounds: // value for 'bounds'
 *      tripId: // value for 'tripId'
 *   },
 * });
 */
export function useElementsQuery(baseOptions?: Apollo.QueryHookOptions<ElementsQuery, ElementsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ElementsQuery, ElementsQueryVariables>(ElementsDocument, options);
      }
export function useElementsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ElementsQuery, ElementsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ElementsQuery, ElementsQueryVariables>(ElementsDocument, options);
        }
// @ts-ignore
export function useElementsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ElementsQuery, ElementsQueryVariables>): Apollo.UseSuspenseQueryResult<ElementsQuery, ElementsQueryVariables>;
export function useElementsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ElementsQuery, ElementsQueryVariables>): Apollo.UseSuspenseQueryResult<ElementsQuery | undefined, ElementsQueryVariables>;
export function useElementsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ElementsQuery, ElementsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ElementsQuery, ElementsQueryVariables>(ElementsDocument, options);
        }
export type ElementsQueryHookResult = ReturnType<typeof useElementsQuery>;
export type ElementsLazyQueryHookResult = ReturnType<typeof useElementsLazyQuery>;
export type ElementsSuspenseQueryHookResult = ReturnType<typeof useElementsSuspenseQuery>;
export type ElementsQueryResult = Apollo.QueryResult<ElementsQuery, ElementsQueryVariables>;
export const LoginDocument = gql`
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
    expiresAt
    user {
      id
      email
      locale
    }
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout($input: LogoutInput!) {
  logout(input: $input) {
    success
  }
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const RenewTokenDocument = gql`
    mutation RenewToken($input: RenewTokenInput!) {
  renewToken(input: $input) {
    accessToken
    refreshToken
    expiresAt
    user {
      id
      email
      locale
    }
  }
}
    `;
export type RenewTokenMutationFn = Apollo.MutationFunction<RenewTokenMutation, RenewTokenMutationVariables>;

/**
 * __useRenewTokenMutation__
 *
 * To run a mutation, you first call `useRenewTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRenewTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [renewTokenMutation, { data, loading, error }] = useRenewTokenMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRenewTokenMutation(baseOptions?: Apollo.MutationHookOptions<RenewTokenMutation, RenewTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RenewTokenMutation, RenewTokenMutationVariables>(RenewTokenDocument, options);
      }
export type RenewTokenMutationHookResult = ReturnType<typeof useRenewTokenMutation>;
export type RenewTokenMutationResult = Apollo.MutationResult<RenewTokenMutation>;
export type RenewTokenMutationOptions = Apollo.BaseMutationOptions<RenewTokenMutation, RenewTokenMutationVariables>;
export const SearchDocument = gql`
    query Search($query: String!) {
  elements(search: $query) {
    id
    name
    icon
    location {
      id
      address
      latitude
      longitude
    }
  }
  trips(search: $query) {
    id
    name
    icon
    description
  }
  placeSearch(query: $query, granularity: REGIONS) {
    placeId
    name
    address
    latitude
    longitude
    types
  }
}
    `;

/**
 * __useSearchQuery__
 *
 * To run a query within a React component, call `useSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchQuery({
 *   variables: {
 *      query: // value for 'query'
 *   },
 * });
 */
export function useSearchQuery(baseOptions: Apollo.QueryHookOptions<SearchQuery, SearchQueryVariables> & ({ variables: SearchQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
      }
export function useSearchLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SearchQuery, SearchQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
        }
// @ts-ignore
export function useSearchSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SearchQuery, SearchQueryVariables>): Apollo.UseSuspenseQueryResult<SearchQuery, SearchQueryVariables>;
export function useSearchSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchQuery, SearchQueryVariables>): Apollo.UseSuspenseQueryResult<SearchQuery | undefined, SearchQueryVariables>;
export function useSearchSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchQuery, SearchQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SearchQuery, SearchQueryVariables>(SearchDocument, options);
        }
export type SearchQueryHookResult = ReturnType<typeof useSearchQuery>;
export type SearchLazyQueryHookResult = ReturnType<typeof useSearchLazyQuery>;
export type SearchSuspenseQueryHookResult = ReturnType<typeof useSearchSuspenseQuery>;
export type SearchQueryResult = Apollo.QueryResult<SearchQuery, SearchQueryVariables>;