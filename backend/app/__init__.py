from flask import Flask, jsonify
from .config import config_map
from .extensions import db, cors

def create_app(config_name="default"):
    app = Flask(__name__)
    config_obj = config_map[config_name]()
    app.config.from_object(config_obj)

    # Khởi tạo URL CSDL (Sử dụng property DATABASE_URL trong thư viện config)
    app.config['SQLALCHEMY_DATABASE_URI'] = config_obj.DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize Extensions
    db.init_app(app)
    cors.init_app(app)

    # Health Check Endpoint
    @app.route('/api/health')
    def health_check():
        from sqlalchemy import text
        try:
            db.session.execute(text('SELECT 1'))
            db_status = "connected"
        except Exception as e:
            db_status = f"disconnected: {e}"

        return jsonify({
            "success": True,
            "message": "Server is running",
            "data": {
                "status": "healthy",
                "database": db_status
            }
        }), 200

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.address_routes import address_bp
    from .routes.order_routes import order_bp
    from .routes.tracking_routes import tracking_bp
    from .routes.finance_routes import finance_bp
    from .routes.partner_routes import partner_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(address_bp, url_prefix='/api/address-book')
    app.register_blueprint(order_bp, url_prefix='/api/orders')
    app.register_blueprint(tracking_bp, url_prefix='/api/tracking')
    app.register_blueprint(finance_bp, url_prefix='/api/reconciliations')
    app.register_blueprint(partner_bp, url_prefix='/api/partner')

    return app
