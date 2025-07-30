from app.models.baseModel import BaseModel
from app.models.users import User
from app.models.place import Place
from extensions import db
from sqlalchemy.orm import validates
'''
Place class inherite of base model and is linked to one place_owner
'''


class Review(BaseModel):
    """
    Define review class
    """
    __tablename__ = 'reviews'

    text = db.Column(db.String(516), nullable=False)
    rating = db.Column(db.SmallInteger(), nullable=False)
    place_id = db.Column(db.String(36), db.ForeignKey('places.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    def __init__(self, text, rating, place, user):
        """
        Initialize a review by multiple parameters given
        args:
            text(str min=1): to define text of the review
            rating(int min=1 max=5): define rating of the review
            place(Place exist=True): define place of the review
            user(User exist=True): define user of the review
        raises:
            TypeError: if attributes have correct type
            ValueError: if attribute respect exigence
        """
        super().__init__()

        self.text = text
        self.rating = rating
        self.place = place
        self.user = user

    @validates("text")
    def validate_text(self, _, text):
        if not isinstance(text, str):
            raise TypeError("text must be a string")
        return text

    @validates("rating")
    def validate_rating(self, _, rating):
        if not isinstance(rating, int):
            raise TypeError("rating must be a int")
        elif rating < 1 or rating > 5:
            raise ValueError("rating must be between 1 and 5")
        return rating

    @validates("place")
    def validate_place(self, _, place):
        if not hasattr(place, 'id'):
            raise ValueError("Invalid place")
        return place

    @validates("user")
    def validate_user(self, _, user):
        if not hasattr(user, 'id'):
            raise ValueError("Invalid user")
        return user

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'rating': self.rating,
            'place': self.place.id,
            'user': self.user.id
        }

    def __str__(self):
        return "{}".format(self.text)
