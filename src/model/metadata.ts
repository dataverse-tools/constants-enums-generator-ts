export const enum AttributeTypeCode {
    Boolean,
    Customer,
    DateTime,
    Decimal,
    Double,
    Integer,
    Lookup,
    Memo,
    Money,
    Owner,
    PartyList,
    Picklist,
    State,
    Status,
    String,
    Uniqueidentifier,
    CalendarRules,
    Virtual,
    BigInt,
    ManagedProperty,
    EntityName
}

export interface Metadata {
    LogicalName: string;
    VariableName: string | null;
    DisplayName: string | null;
    Description: string | null;
}

export interface EntityMetadata extends Metadata {
    Attributes: AttributeMetadata[];
}

export interface AttributeMetadata extends Metadata {
    VariableName: string;
    Type: AttributeTypeCode | null;
    Options: OptionMetadata[] | null;
}

export interface OptionMetadata {
    Label: string;
    Value: number;
}

export interface EntityMetadataModule {    
    default: EntityMetadata[];
}
