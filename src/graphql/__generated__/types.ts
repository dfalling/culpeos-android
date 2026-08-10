/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@apollo/client';
import { gql } from '@apollo/client';
export type ElementInput = {
  completed: boolean;
  description: string;
  icon: string;
  id: string;
  labels?: Array<string> | null | undefined;
  location?: LocationInput | null | undefined;
  name: string;
  /** The element's photos, as an ordered list of photo ids (from createPhoto). This is the complete desired set: reordering, removing, or adding ids reorders/removes/adds photos. Omit to leave photos unchanged. */
  photoIds?: Array<string> | null | undefined;
  schedule?: ScheduleInput | null | undefined;
  tripIds?: Array<string> | null | undefined;
  uri: string;
};

export type GeoBounds = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

/** How a list of labels is matched against an element's labels */
export type LabelMatchMode =
  /** Element has every one of the given labels */
  | 'ALL'
  /** Element has at least one of the given labels */
  | 'ANY';

export type LocationInput = {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string | null | undefined;
};

export type LoginInput = {
  /** Optional human-readable label for this session (e.g. "iPhone 15"). Displayed in the session list. */
  deviceLabel?: string | null | undefined;
  email: string;
  password: string;
};

export type LogoutInput = {
  refreshToken: string;
};

/**
 * A photo to create and attach to an element or trip inline, as part of an
 * element/trip mutation. Required fields depend on `type`:
 *
 * - `s3`: `storage_key` (image URLs are derived server-side)
 * - `unsplash`: `full`, `regular`, `small`, `thumbnail`, `credit_name`, `attribution_url`
 * - `wikimedia`: the unsplash fields plus `license`
 *
 * `description` is the image's alt text. It is optional for `s3` photos
 * (defaults to "" when omitted) but required for `unsplash`/`wikimedia`.
 */
export type PhotoInput = {
  attributionUrl?: string | null | undefined;
  creditName?: string | null | undefined;
  creditUrl?: string | null | undefined;
  /** Image alt text. Optional for s3 (defaults to ""); required for unsplash/wikimedia. */
  description?: string | null | undefined;
  full?: string | null | undefined;
  license?: string | null | undefined;
  regular?: string | null | undefined;
  small?: string | null | undefined;
  /** Upload key from create_upload_url; required for s3 photos */
  storageKey?: string | null | undefined;
  thumbnail?: string | null | undefined;
  type: PhotoType;
};

export type PhotoType =
  | 'S3'
  | 'UNSPLASH'
  | 'WIKIMEDIA';

export type RenewTokenInput = {
  refreshToken: string;
};

export type ScheduleInput = {
  allDay: boolean;
  endDate: string;
  endTime?: string | null | undefined;
  endTz: string;
  startDate: string;
  startTime?: string | null | undefined;
  startTz: string;
};

export type CreatePhotoMutationVariables = Exact<{
  input: PhotoInput;
}>;


export type CreatePhotoMutation = { createPhoto: { id: string, thumbnail: string, regular: string, description: string } };

export type CreateUploadUrlQueryVariables = Exact<{
  bustCache?: number | null | undefined;
}>;


export type CreateUploadUrlQuery = { createUploadUrl: { url: string, key: string } };

export type DeleteElementMutationVariables = Exact<{
  id: string;
}>;


export type DeleteElementMutation = { deleteElement: { id: string } };

export type ElementDetailQueryVariables = Exact<{
  id: string;
}>;


export type ElementDetailQuery = { element: { id: string, name: string, icon: string, description: string, completed: boolean, uri: string, labels: Array<string>, trips: Array<{ id: string }>, location: { id: string, address: string, latitude: number, longitude: number, placeId: string | null } | null, photos: Array<{ id: string, thumbnail: string, regular: string, description: string }>, schedule: { id: string, allDay: boolean, startDate: string, endDate: string, startTime: string | null, endTime: string | null, startTz: string, endTz: string } | null, metadata: { type: string | null, number: string | null, reservation: string | null, seat: string | null, paymentDetails: string | null, address: string | null, departureLocation: string | null, arrivalLocation: string | null } | null } };

export type ElementsQueryVariables = Exact<{
  bounds?: GeoBounds | null | undefined;
  tripId?: string | null | undefined;
  labels?: Array<string> | string | null | undefined;
  labelsMatch?: LabelMatchMode | null | undefined;
}>;


export type ElementsQuery = { elements: Array<{ id: string, name: string, icon: string, labels: Array<string>, location: { id: string, latitude: number, longitude: number } | null }> };

export type ImportShareMutationVariables = Exact<{
  content: string;
}>;


export type ImportShareMutation = { importShare: { id: string, name: string, icon: string, description: string, completed: boolean, uri: string, labels: Array<string>, trips: Array<{ id: string }>, location: { id: string, address: string, latitude: number, longitude: number, placeId: string | null } | null, photos: Array<{ id: string, thumbnail: string, regular: string, description: string }>, schedule: { id: string, allDay: boolean, startDate: string, endDate: string, startTime: string | null, endTime: string | null, startTz: string, endTz: string } | null, metadata: { type: string | null, number: string | null, reservation: string | null, seat: string | null, paymentDetails: string | null, address: string | null, departureLocation: string | null, arrivalLocation: string | null } | null } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { accessToken: string, refreshToken: string, expiresAt: string, user: { id: string, email: string, locale: string | null } } };

export type LogoutMutationVariables = Exact<{
  input: LogoutInput;
}>;


export type LogoutMutation = { logout: { success: boolean } };

export type RenewTokenMutationVariables = Exact<{
  input: RenewTokenInput;
}>;


export type RenewTokenMutation = { renewToken: { accessToken: string, refreshToken: string, expiresAt: string, user: { id: string, email: string, locale: string | null } } };

export type SearchQueryVariables = Exact<{
  query: string;
}>;


export type SearchQuery = { elements: Array<{ id: string, name: string, icon: string, labels: Array<string>, location: { id: string, address: string, latitude: number, longitude: number } | null }>, trips: Array<{ id: string, name: string, icon: string, description: string }>, placeSearch: Array<{ placeId: string, name: string, address: string, latitude: number, longitude: number, types: Array<string> | null }> };

export type TripsQueryVariables = Exact<{ [key: string]: never; }>;


export type TripsQuery = { trips: Array<{ id: string, name: string, icon: string }> };

export type UpdateElementMutationVariables = Exact<{
  input: ElementInput;
}>;


export type UpdateElementMutation = { updateElement: { id: string, name: string, icon: string, description: string, completed: boolean, uri: string, labels: Array<string>, trips: Array<{ id: string }>, location: { id: string, address: string, latitude: number, longitude: number, placeId: string | null } | null, photos: Array<{ id: string, thumbnail: string, regular: string, description: string }>, schedule: { id: string, allDay: boolean, startDate: string, endDate: string, startTime: string | null, endTime: string | null, startTz: string, endTz: string } | null, metadata: { type: string | null, number: string | null, reservation: string | null, seat: string | null, paymentDetails: string | null, address: string | null, departureLocation: string | null, arrivalLocation: string | null } | null } };


export const CreatePhotoDocument = gql`
    mutation CreatePhoto($input: PhotoInput!) {
  createPhoto(input: $input) {
    id
    thumbnail
    regular
    description
  }
}
    ` as unknown as DocumentNode<CreatePhotoMutation, CreatePhotoMutationVariables>;
export const CreateUploadUrlDocument = gql`
    query CreateUploadUrl($bustCache: Int) {
  createUploadUrl(bustCache: $bustCache) {
    url
    key
  }
}
    ` as unknown as DocumentNode<CreateUploadUrlQuery, CreateUploadUrlQueryVariables>;
export const DeleteElementDocument = gql`
    mutation DeleteElement($id: String!) {
  deleteElement(id: $id) {
    id
  }
}
    ` as unknown as DocumentNode<DeleteElementMutation, DeleteElementMutationVariables>;
export const ElementDetailDocument = gql`
    query ElementDetail($id: String!) {
  element(id: $id) {
    id
    name
    icon
    description
    completed
    uri
    labels
    trips {
      id
    }
    location {
      id
      address
      latitude
      longitude
      placeId
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
      startTz
      endTz
    }
    metadata {
      type
      number
      reservation
      seat
      paymentDetails
      address
      departureLocation
      arrivalLocation
    }
  }
}
    ` as unknown as DocumentNode<ElementDetailQuery, ElementDetailQueryVariables>;
export const ElementsDocument = gql`
    query Elements($bounds: GeoBounds, $tripId: String, $labels: [String!], $labelsMatch: LabelMatchMode) {
  elements(
    bounds: $bounds
    tripId: $tripId
    labels: $labels
    labelsMatch: $labelsMatch
  ) {
    id
    name
    icon
    labels
    location {
      id
      latitude
      longitude
    }
  }
}
    ` as unknown as DocumentNode<ElementsQuery, ElementsQueryVariables>;
export const ImportShareDocument = gql`
    mutation ImportShare($content: String!) {
  importShare(content: $content) {
    id
    name
    icon
    description
    completed
    uri
    labels
    trips {
      id
    }
    location {
      id
      address
      latitude
      longitude
      placeId
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
      startTz
      endTz
    }
    metadata {
      type
      number
      reservation
      seat
      paymentDetails
      address
      departureLocation
      arrivalLocation
    }
  }
}
    ` as unknown as DocumentNode<ImportShareMutation, ImportShareMutationVariables>;
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
    ` as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout($input: LogoutInput!) {
  logout(input: $input) {
    success
  }
}
    ` as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
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
    ` as unknown as DocumentNode<RenewTokenMutation, RenewTokenMutationVariables>;
export const SearchDocument = gql`
    query Search($query: String!) {
  elements(search: $query) {
    id
    name
    icon
    labels
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
    ` as unknown as DocumentNode<SearchQuery, SearchQueryVariables>;
export const TripsDocument = gql`
    query Trips {
  trips {
    id
    name
    icon
  }
}
    ` as unknown as DocumentNode<TripsQuery, TripsQueryVariables>;
export const UpdateElementDocument = gql`
    mutation UpdateElement($input: ElementInput!) {
  updateElement(input: $input) {
    id
    name
    icon
    description
    completed
    uri
    labels
    trips {
      id
    }
    location {
      id
      address
      latitude
      longitude
      placeId
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
      startTz
      endTz
    }
    metadata {
      type
      number
      reservation
      seat
      paymentDetails
      address
      departureLocation
      arrivalLocation
    }
  }
}
    ` as unknown as DocumentNode<UpdateElementMutation, UpdateElementMutationVariables>;