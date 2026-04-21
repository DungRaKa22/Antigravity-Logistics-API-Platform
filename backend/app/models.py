from .extensions import db
from datetime import datetime
from sqlalchemy.dialects.mssql import NVARCHAR

class User(db.Model):
    __tablename__ = 'Users'

    UserID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Username = db.Column(db.String(100), unique=True, nullable=False)
    PasswordHash = db.Column(db.String(255), nullable=False)
    FullName = db.Column(NVARCHAR(255), nullable=False)
    Role = db.Column(db.String(20), nullable=False)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    addresses = db.relationship('AddressBook', backref='user', cascade="all, delete-orphan")
    orders = db.relationship('Order', foreign_keys='Order.Sender_UserID', backref='sender')

class AddressBook(db.Model):
    __tablename__ = 'AddressBook'

    AddressID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    UserID = db.Column(db.Integer, db.ForeignKey('Users.UserID', ondelete='CASCADE'), nullable=False)
    ContactName = db.Column(NVARCHAR(255), nullable=False)
    ContactPhone = db.Column(db.String(20), nullable=False)
    FullAddress = db.Column(NVARCHAR(500), nullable=False)
    Latitude = db.Column(db.Numeric(10, 6), nullable=True)
    Longitude = db.Column(db.Numeric(10, 6), nullable=True)

class Order(db.Model):
    __tablename__ = 'Orders'

    OrderID = db.Column(db.String(50), primary_key=True)
    Sender_UserID = db.Column(db.Integer, db.ForeignKey('Users.UserID'), nullable=False)
    ReceiverName = db.Column(NVARCHAR(255), nullable=False)
    ReceiverPhone = db.Column(db.String(20), nullable=False)
    ReceiverAddress = db.Column(NVARCHAR(500), nullable=False)
    WeightGram = db.Column(db.Integer, nullable=False)
    DistanceKm = db.Column(db.Numeric(10, 2), nullable=True)
    ShippingFee = db.Column(db.Numeric(18, 2), nullable=False)
    CodAmount = db.Column(db.Numeric(18, 2), nullable=False, default=0)
    CurrentStatus = db.Column(db.String(50), nullable=False)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    history_logs = db.relationship('TrackingHistory', backref='order', cascade="all, delete-orphan")
    reconciliation = db.relationship('Reconciliation', backref='order', uselist=False)

class TrackingHistory(db.Model):
    __tablename__ = 'TrackingHistory'

    HistoryID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    OrderID = db.Column(db.String(50), db.ForeignKey('Orders.OrderID', ondelete='CASCADE'), nullable=False)
    StatusCode = db.Column(db.String(50), nullable=False)
    LocationInfo = db.Column(NVARCHAR(500), nullable=True)
    UpdatedBy_AdminID = db.Column(db.Integer, db.ForeignKey('Users.UserID'), nullable=False)
    Timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    admin = db.relationship('User', foreign_keys=[UpdatedBy_AdminID])

class Reconciliation(db.Model):
    __tablename__ = 'Reconciliations'

    ReconID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    OrderID = db.Column(db.String(50), db.ForeignKey('Orders.OrderID'), unique=True, nullable=False)
    Shop_UserID = db.Column(db.Integer, db.ForeignKey('Users.UserID'), nullable=False)
    TotalCollected = db.Column(db.Numeric(18, 2), nullable=False)
    FeeDeducted = db.Column(db.Numeric(18, 2), nullable=False)
    FinalPayout = db.Column(db.Numeric(18, 2), nullable=False)
    ReconStatus = db.Column(db.String(50), nullable=False)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)
    ProcessedAt = db.Column(db.DateTime, nullable=True)

    shop = db.relationship('User', foreign_keys=[Shop_UserID])

class ApiKey(db.Model):
    __tablename__ = 'ApiKeys'

    KeyID = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Partner_UserID = db.Column(db.Integer, db.ForeignKey('Users.UserID', ondelete='CASCADE'), nullable=False)
    ApiKeyString = db.Column(db.String(64), unique=True, nullable=False)
    IsActive = db.Column(db.Boolean, default=True)
    CreatedAt = db.Column(db.DateTime, default=datetime.utcnow)

    partner = db.relationship('User')
