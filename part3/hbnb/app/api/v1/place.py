from flask_restx import Namespace, Resource, fields
from app.services import facade
from flask_jwt_extended import jwt_required, get_jwt_identity

api = Namespace('places', description='Place operations')

# Define the models for related entities
amenity_model = api.model('PlaceAmenity', {
    'id': fields.String(description='Amenity ID'),
    'name': fields.String(description='Name of the amenity')
})

user_model = api.model('PlaceUser', {
    'id': fields.String(description='User ID'),
    'first_name': fields.String(description='First name of the owner'),
    'last_name': fields.String(description='Last name of the owner'),
    'email': fields.String(description='Email of the owner')
})

# Define the place model for input validation and documentation
place_model = api.model('Place', {
    'title': fields.String(required=True, description='Title of the place'),
    'description': fields.String(description='Description of the place'),
    'price': fields.Float(required=True, description='Price per night'),
    'latitude': fields.Float(required=True, description='Latitude of the place'),
    'longitude': fields.Float(required=True, description='Longitude of the place'),
    'owner_id': fields.String(required=True, description='ID of the owner'),
    'amenities': fields.List(fields.String, required=False, description="List of amenities ID's")
})


@api.route('/')
class PlaceList(Resource):
    @api.expect(place_model)
    @api.response(201, 'Place successfully created')
    @api.response(400, 'Invalid input data')
    @jwt_required()
    def post(self):
        """Register a new place"""
        place_data = api.payload
        if not place_data:
            return {"error": "Missing payload"}, 400
        current_user = get_jwt_identity()
        place_data["owner_id"] = current_user["id"]
        try:
            new_place = facade.create_place(place_data)
        except (TypeError, ValueError) as e:
            return {'error': str(e)}, 400

        return new_place.to_dict(), 201

    @api.response(200, "List of places retrieved successfully")
    def get(self):
        """Retrieve a list of all places"""
        places = facade.get_all_places()
        result = []
        for place in places:
            result.append({
                'id': place.id,
                'title': place.title,
                'latitude': place.latitude,
                'longitude': place.longitude,
                'price': place.price
            })

        return result, 200


@api.route('/<place_id>')
class PlaceResource(Resource):
    @api.response(200, 'Place details retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get place details by ID"""
        place = facade.get_place(place_id)
        if not place:
            return {'error': 'Place not found'}, 404
        return place.to_dict(), 200

    @api.expect(place_model)
    @api.response(200, 'Place updated successfully')
    @api.response(404, 'Place not found')
    @api.response(400, 'Invalid input data')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def put(self, place_id):
        """Update a place's information"""
        current_user = get_jwt_identity()
        is_admin = current_user['is_admin']
        data = api.payload
        if not data:
            return {'error': 'Missing or invalid JSON payload'}, 400
        place = facade.get_place(place_id)

        if place.owner.id != current_user["id"] and not is_admin:
            return {'error': 'Unauthorized action'}, 403

        try:
            facade.update_place(place_id, data)
        except ValueError as e:
            return {'error': str(e)}, 404
        except Exception as e:
            return {'error': str(e)}, 404

        return {'message': 'Place updated successfully'}, 200

    @api.response(200, 'Place deleted successfully')
    @api.response(404, 'Place not found')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def delete(self, place_id):
        """Delete a place"""
        place = facade.get_place(place_id)
        current_user = get_jwt_identity()
        is_admin = current_user['is_admin']

        if not place:
            return {'error': 'Place not found'}, 404

        if place.user.id != current_user["id"] and not is_admin:
            return {'error': 'Unauthorized action'}, 403

        facade.delete_place(place_id)
        return {"message": "Place deleted successfully"}, 200
