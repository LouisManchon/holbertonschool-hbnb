from flask_restx import Namespace, Resource, fields
from app.services import facade
from flask_jwt_extended import jwt_required, get_jwt_identity

api = Namespace('reviews', description='Review operations')

# Define the review model for input validation and documentation
review_model = api.model('Review', {
    'text': fields.String(required=True, description='Text of the review'),
    'rating': fields.Integer(required=True, description='Rating of the place (1-5)'),
    'place': fields.String(required=True, description='ID of the place'),
    'user': fields.String(required=True, description='ID of the user')
})

@api.route('/')
class ReviewList(Resource):
    @api.expect(review_model)
    @api.response(201, 'Review successfully created')
    @api.response(400, 'Invalid input data')
    @jwt_required()
    def post(self):
        """Register a new review"""
        user_review = api.payload
        current_user = get_jwt_identity()
        current_user_id = current_user["id"]
        place = facade.get_place(user_review["place"])
        if not place:
            return {'error': 'Place not found'}, 404

        if place.owner.id == current_user_id:
            return {'error': 'You cannot review your own place.'}, 400

        for review in place.reviews:
            if review.user.id == current_user_id:
                return {'error': 'You have already reviewed this place.'}, 400

        # Forcer l'user à être celui connecté (ignore ce que le client a envoyé)
        user_review["user"] = current_user_id

        try:
            new_review = facade.create_review(user_review)
        except (TypeError, ValueError) as e:
            return {'error': str(e)}, 400
        return new_review.to_dict(), 201


    @api.response(200, 'List of reviews retrieved successfully')
    def get(self):
        """Retrieve a list of all reviews"""
        reviews = facade.get_all_reviews()
        return [{
            'id': review.id,
            'text': review.text,
            'rating': review.rating,
            'place': review.place.id,
            'user': review.user.id} for review in reviews
        ]


@api.route('/<review_id>')
class ReviewResource(Resource):
    @api.response(200, 'Review details retrieved successfully')
    @api.response(404, 'Review not found')
    def get(self, review_id):
        """Get review details by ID"""
        review = facade.get_review(review_id)
        if not review:
            return {'error': 'review not found'}, 404
        return review.to_dict(), 200

    @api.expect(review_model)
    @api.response(200, 'Review updated successfully')
    @api.response(404, 'Review not found')
    @api.response(400, 'Invalid input data')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def put(self, review_id):
        """Update a review's information"""
        review_data = api.payload
        current_user = get_jwt_identity()
        is_admin = current_user['is_admin']

        review = facade.get_review(review_id)
        if not review:
            return {'error': 'review not found'}, 404

        if review.user.id != current_user["id"] and not is_admin:
            return {'error': 'Unauthorized action'}, 403

        review_data["user"] = current_user["id"]
        try:
            review_updated = facade.update_review(review_id, review_data)
            if not review_updated:
                return {'error': 'review not found'}, 404
        except (TypeError, ValueError) as e:
            return {'error': str(e)}, 400
        return {"message": "Review successfully updated"}, 200

    @api.response(200, 'Review deleted successfully')
    @api.response(404, 'Review not found')
    @api.response(403, 'Unauthorized action')
    @jwt_required()
    def delete(self, review_id):
        """Delete a review"""
        review = facade.get_review(review_id)
        current_user = get_jwt_identity()
        is_admin = current_user['is_admin']

        if not review:
            return {'error': 'review not found'}, 404

        if review.user.id != current_user["id"] and not is_admin:
            return {'error': 'Unauthorized action'}, 403

        facade.delete_review(review_id)
        return {"message": "Review deleted successfully"}, 200


@api.route('/places/<place_id>/reviews')
class PlaceReviewList(Resource):
    @api.response(200, 'List of reviews for the place retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get all reviews for a specific place"""
        place = facade.get_place(place_id)
        if not place:
            return {'error': 'Place not found'}, 404
        reviews = facade.get_reviews_by_place(place_id)
        return [review.to_dict() for review in reviews], 200
